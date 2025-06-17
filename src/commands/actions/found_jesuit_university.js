const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const actionsManager = require('../../game/actionsManager');
const factionManager = require('../../game/factionManager');
const spaceManager = require('../../game/spaceManager');
const cardManager = require('../../game/cardManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('found_jesuit_university')
        .setDescription('Add a Jesuit university to any Catholic space on the map.')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power performing the action')
                .setRequired(true)
                .addChoices({ name: 'Papacy', value: 'Papacy' }))
        .addStringOption(option =>
            option.setName('space')
                .setDescription('The space to add the university to')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const power = interaction.options.getString('power');
            const spaceName = interaction.options.getString('space');
            const channelName = interaction.channel.name;

            // Get managers for this game
            const am = actionsManager(channelName);
            const sm = spaceManager(channelName);
            const cm = cardManager(channelName);

            // Validate the action exists and can be performed by this power
            await am.validateAction('found_jesuit_university', power);

            // Get the action cost
            const cost = await am.getActionCost('found_jesuit_university', power);

            // Get current game status
            const status = await cm.getStatus();
            if (!status.currentImpulse) {
                throw new Error('No active impulse found');
            }

            // Check if there are enough CP
            if (status.currentImpulse.availableCP < cost) {
                throw new Error(`Not enough CP available. Required: ${cost}, Available: ${status.currentImpulse.availableCP}`);
            }

            // Get space data
            const space = await sm.getSpace(spaceName);
            
            if (!space) {
                throw new Error(`Space ${spaceName} not found`);
            }

            if (!space.catholic) {
                throw new Error(`${spaceName} is not a Catholic space`);
            }

            if (space.jesuiteUniversity) {
                throw new Error(`${spaceName} already has a Jesuit University`);
            }

            // Store old state
            const oldState = { ...space };

            // Update space
            space.jesuiteUniversity = true;
            await sm.updateSpace(spaceName, space);

            // Reduce available CP
            status.currentImpulse.availableCP -= cost;
            await cm.saveStatus(status);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.ACTION_FOUND_JESUIT_UNIVERSITY,
                {
                    actionId: 'found_jesuit_university',
                    power,
                    spaceName,
                    oldState,
                    newState: space,
                    cost
                }
            );

            await interaction.editReply(
                `Added Jesuit university to ${spaceName} (Cost: ${cost} CP, Command ID: ${historyEntry.commandId})`
            );

        } catch (error) {
            console.error('Error in found_jesuit_university command:', error);
            await interaction.editReply({
                content: error.message || 'There was an error executing the action!',
                ephemeral: true
            });
        }
    }
};
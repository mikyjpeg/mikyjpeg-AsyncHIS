const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const actionsManager = require('../../game/actionsManager');
const spaceManager = require('../../game/spaceManager');
const formationManager = require('../../game/formationManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('raise_cavalry_sipahi')
        .setDescription('Raise 1 cavalry in any Ottoman home space (friendly-controlled and not enemy occupied).')
        .addStringOption(option =>
            option.setName('space')
                .setDescription('Space to add the cavalry to')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const power = 'Ottoman'; // Only Ottoman can raise cavalry
            const spaceName = interaction.options.getString('space');
            const channelName = interaction.channel.name;

            // Get managers for this game
            const am = actionsManager(channelName);
            const sm = spaceManager(channelName);
            const fm = formationManager(channelName);

            // Validate the action exists and can be performed by Ottoman
            await am.validateAction('raise_cavalry_sipahi', power);

            // Validate and spend CP
            const { cost, remainingCP } = await am.validateAndSpendCP('raise_cavalry_sipahi', power);

            // Get the space and validate it's a valid target
            const space = await sm.getSpace(spaceName);
            
            // Check if space is a home space of Ottoman and uncontrolled
            if (space.homePower !== power) {
                throw new Error(`${spaceName} is not a home space of ${power}`);
            }
            if (space.controllingPower !== null) {
                throw new Error(`${spaceName} is controlled by ${space.controllingPower}`);
            }

            // Add the cavalry (0 regular, 1 cavalry, no leaders)
            // Note: For Ottoman, secondaryTroops parameter is used for cavalry
            const updatedSpace = await fm.addFormation(spaceName, power, 0, 1, []);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.ACTION_RAISE_CAVALRY_SIPAHI,
                {
                    actionId: 'raise_cavalry_sipahi',
                    power,
                    spaceName,
                    cost,
                    remainingCP
                }
            );

            // Send response
            await interaction.reply({
                content: `Added 1 cavalry for Ottoman in ${spaceName} (Cost: ${cost} CP, ${remainingCP} CP remaining)\n(Command ID: ${historyEntry.commandId})`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in raise_cavalry_sipahi command:', error);
            await interaction.reply({
                content: error.message || 'There was an error executing the action!',
                ephemeral: true
            });
        }
    }
};
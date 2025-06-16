const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const actionsManager = require('../../game/actionsManager');
const navalManager = require('../../game/navalManager');
const cardManager = require('../../game/cardManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('build_corsair')
        .setDescription('Raise 1 corsair at Algiers or in any home port (friendly-controlled and not enemy occupied).')
        .addStringOption(option =>
            option.setName('space')
                .setDescription('Port space to add the corsair to')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const power = 'Ottoman'; // Only Ottoman can build corsairs
            const spaceName = interaction.options.getString('space');
            const channelName = interaction.channel.name;

            // Get managers
            const am = actionsManager(channelName);
            const nm = navalManager(channelName);
            const cm = cardManager(channelName);

            // Get current status to check active player
            const status = await cm.getStatus();
            if (!status.activePlayer) {
                throw new Error('No active player in the current game state');
            }
            if (status.activePlayer.toLowerCase() !== power.toLowerCase()) {
                throw new Error(`Only ${power} can perform this action during their impulse`);
            }

            // Validate the action exists and can be performed by this power
            await am.validateAction('build_corsair', power);

            // Get the action cost
            const cost = await am.getActionCost('build_corsair', power);

            // Check if there are enough CP
            if (status.currentImpulse.availableCP < cost) {
                throw new Error(`Not enough CP available. Required: ${cost}, Available: ${status.currentImpulse.availableCP}`);
            }

            // Create corsair object
            const squadron = {
                power,
                corsair: 1,
                loans: []
            };

            // Add corsair to port
            const updatedSpace = await nm.addSquadronToPort(spaceName, squadron);

            // Deduct CP cost
            status.currentImpulse.availableCP -= cost;
            await cm.saveStatus(status);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.ACTION_BUILD_CORSAIR,
                {
                    actionId: 'build_corsair',
                    power,
                    spaceName,
                    squadron,
                    cost
                }
            );

            // Format response message
            const message = `Added 1 corsair to ${spaceName} for ${power}. Cost: ${cost} CP. (Command ID: ${historyEntry.commandId})`;

            await interaction.reply(message);

        } catch (error) {
            console.error('Error in build_corsair command:', error);
            await interaction.reply({
                content: error.message || 'There was an error executing the action!',
                ephemeral: true
            });
        }
    }
};
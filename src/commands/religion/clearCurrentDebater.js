const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const debaterManager = require('../../game/debaterManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear_current_debater')
        .setDescription('Clear the current debater'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            // Get the channel name
            const channelName = interaction.channel.name;

            // Get all debaters
            const allDebaters = await debaterManager(channelName).getAllDebaters();
            
            // Find current debater
            const currentDebater = allDebaters.find(d => d.isCurrentDebater);
            if (!currentDebater) {
                throw new Error('No current debater found');
            }

            // Store old state
            const oldState = { ...currentDebater };

            // Update debater
            currentDebater.isCurrentDebater = false;
            await debaterManager(channelName).updateDebater(currentDebater.name, currentDebater);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.CLEAR_CURRENT_DEBATER,
                {
                    debaterName: currentDebater.name,
                    oldState,
                    newState: currentDebater
                }
            );

            await interaction.editReply(
                `Cleared current debater ${currentDebater.name} (Command ID: ${historyEntry.commandId})`
            );
        } catch (error) {
            await interaction.editReply(`Failed to clear current debater: ${error.message}`);
        }
    }
}; 
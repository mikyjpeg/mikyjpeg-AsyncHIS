const { SlashCommandBuilder } = require('discord.js');
const debaterManager = require('../../game/debaterManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear_current_debater')
        .setDescription('Clear the current debater status')
        .addStringOption(option =>
            option.setName('debater')
                .setDescription('Name of the debater')
                .setRequired(true)),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const debaterName = interaction.options.getString('debater');
        
        try {
            // Clear the current debater status
            const debater = await debaterManager.clearCurrentDebater(debaterName);
            
            // Record in history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.CLEAR_CURRENT_DEBATER,
                {
                    debater
                }
            );

            await interaction.editReply(`Cleared current debater status for ${debaterName} (Command ID: ${historyEntry.commandId})`);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to clear current debater status: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
const { SlashCommandBuilder } = require('discord.js');
const debaterManager = require('../../game/debaterManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('commit_debater')
        .setDescription('Commit a debater')
        .addStringOption(option =>
            option.setName('debater')
                .setDescription('Name of the debater')
                .setRequired(true)),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const debaterName = interaction.options.getString('debater');
        
        try {
            // Commit the debater
            const debater = await debaterManager.commitDebater(debaterName);
            
            // Record in history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.COMMIT_DEBATER,
                {
                    debater
                }
            );

            await interaction.editReply(`Committed ${debaterName} (Command ID: ${historyEntry.commandId})`);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to commit debater: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
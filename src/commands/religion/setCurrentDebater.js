const { SlashCommandBuilder } = require('discord.js');
const debaterManager = require('../../game/debaterManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set_current_debater')
        .setDescription('Set a debater as the current debater for their faction')
        .addStringOption(option =>
            option.setName('debater')
                .setDescription('Name of the debater')
                .setRequired(true)),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const debaterName = interaction.options.getString('debater');
        
        try {
            // Set the current debater
            const { debater, previousDebater } = await debaterManager.setCurrentDebater(debaterName);
            
            // Record in history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.SET_CURRENT_DEBATER,
                {
                    debater,
                    previousDebater
                }
            );

            let reply = `Set ${debaterName} as the current ${debater.type} debater`;
            if (previousDebater) {
                reply += ` (replaced ${previousDebater})`;
            }
            reply += ` (Command ID: ${historyEntry.commandId})`;

            await interaction.editReply(reply);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to set current debater: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
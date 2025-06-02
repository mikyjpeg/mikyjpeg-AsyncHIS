const { SlashCommandBuilder } = require('discord.js');
const reformerManager = require('../../game/reformerManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add_reformer')
        .setDescription('Add a reformer to their designated space')
        .addStringOption(option =>
            option.setName('reformer')
                .setDescription('Name of the reformer')
                .setRequired(true)),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const reformerName = interaction.options.getString('reformer');
        
        try {
            // Add reformer to their designated space
            const { reformer, space } = await reformerManager.addReformerToSpace(reformerName);
            
            // Record in history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.ADD_REFORMER,
                {
                    reformer,
                    spaceName: space.name
                }
            );

            await interaction.editReply(`Added ${reformerName} to ${space.name} (Command ID: ${historyEntry.commandId})`);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to add reformer: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
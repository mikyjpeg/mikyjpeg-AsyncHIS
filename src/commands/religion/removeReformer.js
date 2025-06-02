const { SlashCommandBuilder } = require('discord.js');
const reformerManager = require('../../game/reformerManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove_reformer')
        .setDescription('Remove a reformer from their space')
        .addStringOption(option =>
            option.setName('reformer')
                .setDescription('Name of the reformer')
                .setRequired(true)),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const reformerName = interaction.options.getString('reformer');
        
        try {
            // Remove reformer from their space
            const { reformer, space } = await reformerManager.removeReformerFromSpace(reformerName);
            
            // Record in history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.REMOVE_REFORMER,
                {
                    reformer,
                    spaceName: space.name
                }
            );

            await interaction.editReply(`Removed ${reformerName} from ${space.name} (Command ID: ${historyEntry.commandId})`);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to remove reformer: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
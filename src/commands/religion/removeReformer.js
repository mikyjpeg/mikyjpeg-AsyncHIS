const { SlashCommandBuilder } = require('discord.js');
const spaceManager = require('../../game/spaceManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove_reformer')
        .setDescription('Remove a reformer from a space')
        .addStringOption(option =>
            option.setName('space')
                .setDescription('The space to remove the reformer from')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reformer')
                .setDescription('Name of the reformer')
                .setRequired(true)),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const spaceName = interaction.options.getString('space');
        const reformerName = interaction.options.getString('reformer');
        
        try {
            // Get the space data
            const space = await spaceManager.getSpace(spaceName);
            
            // Check if reformer exists
            if (!space.reformers || !space.reformers.includes(reformerName)) {
                await interaction.editReply(`${reformerName} is not in ${spaceName}`);
                return;
            }

            // Remove the reformer
            space.reformers = space.reformers.filter(r => r !== reformerName);
            await spaceManager.updateSpace(spaceName, space);
            
            // Record in history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.REMOVE_REFORMER,
                {
                    spaceName,
                    reformerName
                }
            );

            await interaction.editReply(`Removed ${reformerName} from ${spaceName} (Command ID: ${historyEntry.commandId})`);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to remove reformer: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
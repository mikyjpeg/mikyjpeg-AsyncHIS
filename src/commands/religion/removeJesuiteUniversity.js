const { SlashCommandBuilder } = require('discord.js');
const spaceManager = require('../../game/spaceManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove_jesuite')
        .setDescription('Remove a Jesuite university from a space')
        .addStringOption(option =>
            option.setName('space')
                .setDescription('The space to remove the Jesuite university from')
                .setRequired(true)),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const spaceName = interaction.options.getString('space');
        
        try {
            // Get the space data
            const space = await spaceManager.getSpace(spaceName);
            
            // Check if university exists
            if (!space.jesuiteUniversity) {
                await interaction.editReply(`${spaceName} does not have a Jesuite university`);
                return;
            }

            // Remove the university
            space.jesuiteUniversity = false;
            await spaceManager.updateSpace(spaceName, space);
            
            // Record in history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.REMOVE_JESUITE,
                {
                    spaceName
                }
            );

            await interaction.editReply(`Removed the Jesuite university from ${spaceName} (Command ID: ${historyEntry.commandId})`);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to remove Jesuite university: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
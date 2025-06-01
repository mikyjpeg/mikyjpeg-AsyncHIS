const { SlashCommandBuilder } = require('discord.js');
const spaceManager = require('../../game/spaceManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add_jesuite')
        .setDescription('Add a Jesuite university to a space')
        .addStringOption(option =>
            option.setName('space')
                .setDescription('The space to add the Jesuite university to')
                .setRequired(true)),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const spaceName = interaction.options.getString('space');
        
        try {
            // Get the space data
            const space = await spaceManager.getSpace(spaceName);
            
            // Check if space is Catholic
            if (!space.catholic) {
                await interaction.editReply(`Cannot add a Jesuite university to ${spaceName} as it is not Catholic`);
                return;
            }

            // Check if university already exists
            if (space.jesuiteUniversity) {
                await interaction.editReply(`${spaceName} already has a Jesuite university`);
                return;
            }

            // Add the university
            space.jesuiteUniversity = true;
            await spaceManager.updateSpace(spaceName, space);
            
            // Record in history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.ADD_JESUITE,
                {
                    spaceName
                }
            );

            await interaction.editReply(`Added a Jesuite university to ${spaceName} (Command ID: ${historyEntry.commandId})`);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to add Jesuite university: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
const { SlashCommandBuilder } = require('discord.js');
const spaceManager = require('../../game/spaceManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add_reformer')
        .setDescription('Add a reformer to a space')
        .addStringOption(option =>
            option.setName('space')
                .setDescription('The space to add the reformer to')
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
            
            // Check if space is Protestant
            if (space.catholic) {
                await interaction.editReply(`Cannot add a reformer to ${spaceName} as it is Catholic`);
                return;
            }

            // Check if reformer already exists
            if (space.reformers && space.reformers.includes(reformerName)) {
                await interaction.editReply(`${reformerName} is already in ${spaceName}`);
                return;
            }

            // Initialize reformers array if it doesn't exist
            if (!space.reformers) {
                space.reformers = [];
            }

            // Add the reformer
            space.reformers.push(reformerName);
            await spaceManager.updateSpace(spaceName, space);
            
            // Record in history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.ADD_REFORMER,
                {
                    spaceName,
                    reformerName
                }
            );

            await interaction.editReply(`Added ${reformerName} to ${spaceName} (Command ID: ${historyEntry.commandId})`);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to add reformer: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
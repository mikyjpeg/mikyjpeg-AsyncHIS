const { SlashCommandBuilder } = require('discord.js');
const spaceManager = require('../../game/spaceManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list_reformers')
        .setDescription('List all reformers in a space')
        .addStringOption(option =>
            option.setName('space')
                .setDescription('Name of the space to check')
                .setRequired(true)),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const spaceName = interaction.options.getString('space');
        
        try {
            const space = await spaceManager.getSpace(spaceName);
            if (!space) {
                await interaction.editReply(`Space ${spaceName} not found`);
                return;
            }

            // Check if space is Catholic
            if (space.catholic) {
                await interaction.editReply(`${spaceName} is Catholic and cannot have reformers`);
                return;
            }

            // Format reformer list
            if (!space.reformers || space.reformers.length === 0) {
                await interaction.editReply(`No reformers in ${spaceName}`);
                return;
            }

            const reformerList = space.reformers.join(', ');
            await interaction.editReply(`Reformers in ${spaceName}:\n${reformerList}`);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to list reformers: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
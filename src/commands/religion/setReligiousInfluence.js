const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const spaceManager = require('../../game/spaceManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set_religious_influence')
        .setDescription('Set religious influence in a space')
        .addStringOption(option =>
            option.setName('space')
                .setDescription('The space to set influence in')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('protestant')
                .setDescription('Protestant influence value')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('catholic')
                .setDescription('Catholic influence value')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        const spaceName = interaction.options.getString('space');
        const protestantInfluence = interaction.options.getInteger('protestant');
        const catholicInfluence = interaction.options.getInteger('catholic');

        try {
            // Get the space
            const space = await spaceManager(interaction.channelId).getSpace(spaceName);
            
            if (!space) {
                throw new Error(`Space ${spaceName} not found`);
            }

            // Store old state
            const oldState = { ...space };

            // Update space
            space.protestantInfluence = protestantInfluence;
            space.catholicInfluence = catholicInfluence;
            await spaceManager(interaction.channelId).updateSpace(spaceName, space);

            // Record in command history
            const historyEntry = await commandHistory(interaction.channelId).recordSlashCommand(
                interaction,
                COMMAND_TYPES.SET_RELIGIOUS_INFLUENCE,
                {
                    spaceName,
                    oldState,
                    newState: space
                }
            );

            await interaction.editReply(
                `Set religious influence in ${spaceName} to Protestant: ${protestantInfluence}, Catholic: ${catholicInfluence} (Command ID: ${historyEntry.commandId})`
            );
        } catch (error) {
            await interaction.editReply(`Failed to set religious influence: ${error.message}`);
        }
    }
}; 
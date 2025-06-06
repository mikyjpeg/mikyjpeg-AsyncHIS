const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const spaceManager = require('../../game/spaceManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove_jesuite_university')
        .setDescription('Remove a Jesuite university from a space')
        .addStringOption(option =>
            option.setName('space')
                .setDescription('The space to remove the university from')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        const spaceName = interaction.options.getString('space');
        const channelName = interaction.channel.name;

        try {
            // Get space manager for this game
            const sm = spaceManager(channelName);
            
            // Get the space
            const space = await sm.getSpace(spaceName);
            
            if (!space) {
                throw new Error(`Space ${spaceName} not found`);
            }

            if (!space.jesuiteUniversity) {
                throw new Error(`${spaceName} does not have a Jesuite university`);
            }

            // Store old state
            const oldState = { ...space };

            // Update space
            space.jesuiteUniversity = false;
            await sm.updateSpace(spaceName, space);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.REMOVE_JESUITE,
                {
                    spaceName,
                    oldState,
                    newState: space
                }
            );

            await interaction.editReply(
                `Removed Jesuite university from ${spaceName} (Command ID: ${historyEntry.commandId})`
            );
        } catch (error) {
            await interaction.editReply(`Failed to remove Jesuite university: ${error.message}`);
        }
    }
}; 
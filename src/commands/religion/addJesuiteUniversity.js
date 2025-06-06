const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const spaceManager = require('../../game/spaceManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add_jesuite_university')
        .setDescription('Add a Jesuite university to a space')
        .addStringOption(option =>
            option.setName('space')
                .setDescription('The space to add the university to')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        const spaceName = interaction.options.getString('space');

        try {
            // Get the channel name
            const channelName = interaction.channel.name;

            // Get space data
            const space = await spaceManager(channelName).getSpace(spaceName);
            
            if (!space) {
                throw new Error(`Space ${spaceName} not found`);
            }

            if (space.jesuiteUniversity) {
                throw new Error(`${spaceName} already has a Jesuite University`);
            }

            // Store old state
            const oldState = { ...space };

            // Update space
            space.jesuiteUniversity = true;
            await spaceManager(channelName).updateSpace(spaceName, space);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.ADD_JESUITE,
                {
                    spaceName,
                    oldState,
                    newState: space
                }
            );

            await interaction.editReply(
                `Added Jesuite university to ${spaceName} (Command ID: ${historyEntry.commandId})`
            );
        } catch (error) {
            await interaction.editReply(`Failed to add Jesuite university: ${error.message}`);
        }
    }
}; 
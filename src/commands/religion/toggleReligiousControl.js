const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const spaceManager = require('../../game/spaceManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('toggle_religious_control')
        .setDescription('Toggle religious control of a space between Catholic and Protestant')
        .addStringOption(option =>
            option.setName('space')
                .setDescription('The space to toggle religious control')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        const spaceName = interaction.options.getString('space');

        try {
            // Get the space
            const space = await spaceManager(interaction.channelId).getSpace(spaceName);
            
            if (!space) {
                throw new Error(`Space ${spaceName} not found`);
            }

            if (space.catholic === undefined) {
                throw new Error(`Space ${spaceName} is not eligible for religious control`);
            }

            // Store old state
            const oldState = { ...space };

            // Toggle religious control
            space.catholic = !space.catholic;
            await spaceManager(interaction.channelId).updateSpace(spaceName, space);

            // Record in command history
            const historyEntry = await commandHistory(interaction.channelId).recordSlashCommand(
                interaction,
                COMMAND_TYPES.TOGGLE_RELIGIOUS_CONTROL,
                {
                    spaceName,
                    oldState,
                    newState: space
                }
            );

            const newControl = space.catholic ? 'Catholic' : 'Protestant';
            await interaction.editReply(
                `Changed religious control of ${spaceName} to ${newControl} (Command ID: ${historyEntry.commandId})`
            );
        } catch (error) {
            await interaction.editReply(`Failed to toggle religious control: ${error.message}`);
        }
    }
}; 
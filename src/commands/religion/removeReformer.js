const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const reformerManager = require('../../game/reformerManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove_reformer')
        .setDescription('Remove a reformer')
        .addStringOption(option =>
            option.setName('reformer')
                .setDescription('The reformer to remove')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        const reformerName = interaction.options.getString('reformer');
        const channelName = interaction.channel.name;

        try {
            // Get reformer manager for this game
            const rm = reformerManager(channelName);
            
            // Get the reformer
            const reformer = await rm.getReformer(reformerName);
            
            if (!reformer) {
                throw new Error(`Reformer ${reformerName} not found`);
            }

            if (!reformer.isActive) {
                throw new Error(`${reformerName} is not active`);
            }

            // Store old state
            const oldState = { ...reformer };

            // Update reformer
            reformer.isActive = false;
            await rm.updateReformer(reformerName, reformer);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.REMOVE_REFORMER,
                {
                    reformerName,
                    oldState,
                    newState: reformer
                }
            );

            await interaction.editReply(
                `Removed reformer ${reformerName} (Command ID: ${historyEntry.commandId})`
            );
        } catch (error) {
            await interaction.editReply(`Failed to remove reformer: ${error.message}`);
        }
    }
}; 
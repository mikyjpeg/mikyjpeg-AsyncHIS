const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete_game')
        .setDescription('Deletes the current game, removing both the channel and game data')
        .addBooleanOption(option =>
            option.setName('confirm')
                .setDescription('Confirm that you want to delete this game')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const confirm = interaction.options.getBoolean('confirm');
            if (!confirm) {
                await interaction.reply({
                    content: 'Game deletion cancelled.',
                    ephemeral: true
                });
                return;
            }

            // Check if we're in a game channel (should end with _his)
            const channelName = interaction.channel.name;
            if (!channelName.endsWith('_his')) {
                await interaction.reply({
                    content: 'This command can only be used in a game channel (channel name should end with _his).',
                    ephemeral: true
                });
                return;
            }

            // Extract gameId from channel name (first 8 characters)
            const gameId = channelName.substring(0, 8);
            const gameDir = path.join(process.cwd(), 'data', 'games', gameId);

            // Check if game directory exists
            if (!await fs.pathExists(gameDir)) {
                await interaction.reply({
                    content: `Game data not found for gameId: ${gameId}`,
                    ephemeral: true
                });
                return;
            }

            // Delete the game directory
            await fs.remove(gameDir);

            // Store channel reference before deletion
            const channelToDelete = interaction.channel;

            await interaction.reply({
                content: `Deleting game ${gameId}...`,
                ephemeral: true
            });

            // Delete the channel
            await channelToDelete.delete('Game deleted via delete_game command');

        } catch (error) {
            console.error('Error deleting game:', error);
            await interaction.reply({
                content: 'There was an error while deleting the game. Please check the logs.',
                ephemeral: true
            });
        }
    },
}; 
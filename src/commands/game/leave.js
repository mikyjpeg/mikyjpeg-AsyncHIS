const { SlashCommandBuilder } = require('discord.js');
const { POWERS } = require('../../game/gameState');
const factionManager = require('../../game/factionManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Leave the game'),

    async execute(interaction) {
        await interaction.deferReply();

        let success = false;
        let errorMessage = null;

        try {
            // Get the channel name and ensure it's a game channel
            const channelName = interaction.channel.name;
            if (!channelName.endsWith('_his')) {
                errorMessage = 'This command can only be used in a game channel (channel name should end with _his).';
                throw new Error(errorMessage);
            }

            // Get the faction manager for this game
            const fm = factionManager(channelName);

            // Find which faction the user controls
            const allFactions = await fm.loadAllFactions();
            const userFaction = Object.values(allFactions).find(f => f.discordUserId === interaction.user.id);

            if (!userFaction) {
                errorMessage = 'You are not controlling any power in this game.';
                throw new Error(errorMessage);
            }

            // Store the previous state for history
            const previousFaction = { ...userFaction };

            // Get the private channel
            const privateChannel = interaction.guild.channels.cache.get(userFaction.privateChannelId);

            // Delete the private channel if it exists
            if (privateChannel) {
                await privateChannel.delete('Power left the game');
            }

            // Reset the faction data
            userFaction.discordUserId = null;
            userFaction.discordUsername = null;
            userFaction.isActive = false;
            userFaction.privateChannelId = null;
            await fm.updateFaction(userFaction.name, userFaction);

            success = true;

            // Record in history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.LEAVE_POWER,
                {
                    power: userFaction.name,
                    previousFaction
                },
                success,
                errorMessage
            );

            await interaction.editReply(`You have left the game as ${userFaction.name}! (Command ID: ${historyEntry.commandId})`);

        } catch (error) {
            // Record the failed attempt in history
            if (interaction.channel) {
                await commandHistory(interaction.channel.name).recordSlashCommand(
                    interaction,
                    COMMAND_TYPES.LEAVE_POWER,
                    {
                        error: error.message
                    },
                    false,
                    error.message
                );
            }
            
            await interaction.editReply(`Failed to leave the game: ${error.message}`);
        }
    }
}; 
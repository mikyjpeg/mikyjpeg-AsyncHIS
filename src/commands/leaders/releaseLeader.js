const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const leaderManager = require('../../game/leaderManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('release_leader')
        .setDescription('Release a captured leader')
        .addStringOption(option =>
            option.setName('leader')
                .setDescription('The leader to release')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        const leaderName = interaction.options.getString('leader');

        try {
            // Get the channel name
            const channelName = interaction.channel.name;

            // Get leader data
            const leader = await leaderManager(channelName).getLeader(leaderName);
            
            if (!leader) {
                throw new Error(`Leader ${leaderName} not found`);
            }

            if (!leader.capturedBy) {
                throw new Error(`${leaderName} is not captured`);
            }

            // Store old state
            const oldState = { ...leader };

            // Update leader
            leader.capturedBy = null;
            await leaderManager(channelName).updateLeader(leaderName, leader);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.RELEASE_LEADER,
                {
                    leaderName,
                    oldState,
                    newState: leader
                }
            );

            await interaction.editReply(
                `${leaderName} has been released! (Command ID: ${historyEntry.commandId})`
            );
        } catch (error) {
            await interaction.editReply(`Failed to release leader: ${error.message}`);
        }
    }
}; 
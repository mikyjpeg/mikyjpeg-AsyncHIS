const { SlashCommandBuilder } = require('discord.js');
const leaderManager = require('../../game/leaderManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('release_leader')
        .setDescription('Release a captured leader')
        .addStringOption(option =>
            option.setName('leader')
                .setDescription('Name of the leader to release')
                .setRequired(true)),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const leaderName = interaction.options.getString('leader');
        
        try {
            // Get leader data
            const leader = await leaderManager.getLeader(leaderName);
            if (!leader) {
                await interaction.editReply(`Leader ${leaderName} not found`);
                return;
            }

            // Check if leader is actually captured
            if (!leader.capturedBy) {
                await interaction.editReply(`${leaderName} is not captured`);
                return;
            }

            // Store captor for history
            const previousCaptor = leader.capturedBy;

            // Release the leader
            leader.capturedBy = null;
            await leaderManager.updateLeader(leaderName, leader);
            
            // Record in history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.RELEASE_LEADER,
                {
                    leaderName,
                    previousCaptor,
                    leaderPower: leader.power
                }
            );

            await interaction.editReply(`${leaderName} has been released from ${previousCaptor}'s captivity (Command ID: ${historyEntry.commandId})`);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to release leader: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
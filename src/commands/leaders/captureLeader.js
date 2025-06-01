const { SlashCommandBuilder } = require('discord.js');
const { GameState, POWERS } = require('../../game/gameState');
const leaderManager = require('../../game/leaderManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('capture_leader')
        .setDescription('Capture a leader')
        .addStringOption(option =>
            option.setName('leader')
                .setDescription('Name of the leader to capture')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('captor')
                .setDescription('Power that captured the leader')
                .setRequired(true)
                .addChoices(...Object.values(POWERS).map(power => ({
                    name: power,
                    value: power
                })))),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const leaderName = interaction.options.getString('leader');
        const captorPower = interaction.options.getString('captor');
        
        try {
            // Get leader data
            const leader = await leaderManager.getLeader(leaderName);
            if (!leader) {
                await interaction.editReply(`Leader ${leaderName} not found`);
                return;
            }

            // Check if leader is already captured
            if (leader.capturedBy) {
                await interaction.editReply(`${leaderName} is already captured by ${leader.capturedBy}`);
                return;
            }

            // Check if captor is trying to capture their own leader
            if (leader.power === captorPower) {
                await interaction.editReply(`${captorPower} cannot capture their own leader`);
                return;
            }

            // Capture the leader
            leader.capturedBy = captorPower;
            await leaderManager.updateLeader(leaderName, leader);
            
            // Record in history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.CAPTURE_LEADER,
                {
                    leaderName,
                    captorPower,
                    leaderPower: leader.power
                }
            );

            await interaction.editReply(`${captorPower} has captured ${leaderName} (Command ID: ${historyEntry.commandId})`);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to capture leader: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
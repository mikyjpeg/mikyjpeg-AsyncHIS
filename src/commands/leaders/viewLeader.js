const { SlashCommandBuilder } = require('discord.js');
const leaderManager = require('../../game/leaderManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('view_leader')
        .setDescription('View details of a leader')
        .addStringOption(option =>
            option.setName('leader')
                .setDescription('Name of the leader to view')
                .setRequired(true)),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const leaderName = interaction.options.getString('leader');
        
        try {
            const leader = await leaderManager.getLeader(leaderName);
            if (!leader) {
                await interaction.editReply(`Leader ${leaderName} not found`);
                return;
            }

            // Format leader details
            let details = `**${leader.name}**\n` +
                         `Power: ${leader.power}\n` +
                         `Battle Rating: ${leader.battleRating}\n` +
                         `Command Rating: ${leader.commandRating}\n`;

            // Add status info
            if (leader.capturedBy) {
                details += `\nCurrently captured by ${leader.capturedBy}`;
            }

            // Add location info if available
            if (leader.location) {
                details += `\nCurrently in ${leader.location}`;
            }

            await interaction.editReply(details);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to view leader: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
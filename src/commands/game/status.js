const { SlashCommandBuilder } = require('discord.js');
const { GameState } = require('../../game/gameState');

module.exports = {
    // Define the slash command
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Show the current game status'),
        
    // Execute function now receives an interaction instead of a message
    async execute(interaction) {
        await interaction.deferReply(); // Let user know we're processing
        
        try {
            const status = await GameState.getGameStatus();
            
            // Format the response based on the game status
            let response = `**Game Status**\n`;
            response += `Turn: ${status.turn}\n`;
            response += `Phase: ${status.phase}\n\n`;
            
            // Show available powers
            response += `**Available Powers:**\n`;
            if (status.availablePowers.length > 0) {
                response += status.availablePowers.map(power => `- ${power}`).join('\n');
            } else {
                response += 'All powers have been claimed\n';
            }
            
            // Show faction assignments
            response += `\n**Power Assignments:**\n`;
            for (const [power, data] of Object.entries(status.factions)) {
                response += `${power}: ${data.isActive ? data.discordUsername : 'Unassigned'}\n`;
            }

            await interaction.editReply(response);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to get game status: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
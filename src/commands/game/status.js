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
            const gameState = GameState(interaction.channelId);
            const status = await gameState.getGameStatus();
            
            // Format the response based on the game status
            let response = `**Game Status**\n`;
            response += `Turn: ${status.turn}\n`;
            response += `Phase: ${status.phase}\n\n`;
            
            // Add active factions info
            response += '**Active Powers**\n';
            for (const [power, data] of Object.entries(status.factions)) {
                if (data.isActive) {
                    response += `${power}: ${data.discordUsername} (${data.victoryPoints || 0} VP)\n`;
                }
            }
            
            // Add available powers info if any
            if (status.availablePowers && status.availablePowers.length > 0) {
                response += '\n**Available Powers**\n';
                response += status.availablePowers.map(power => `- ${power}`).join('\n');
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
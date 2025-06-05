const { SlashCommandBuilder } = require('discord.js');
const factionManager = require('../../game/factionManager');
const statusManager = require('../../game/statusManager');

module.exports = {
    // Define the slash command
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Show the current game status'),
        
    // Execute function now receives an interaction instead of a message
    async execute(interaction) {
        await interaction.deferReply(); // Let user know we're processing
        
        try {
            // Get the channel name
            const channelName = interaction.channel.name;

            // Get the status manager for this game
            const sm = statusManager(channelName);
            const fm = factionManager(channelName);

            // Get game status
            const status = await sm.getStatus();
            const factions = await fm.getAllFactions();
            
            // Format the response based on the game status
            let response = `**Game Status**\n`;
            response += `Turn: ${status.turn || 1}\n`;
            response += `Phase: ${status.phase || 'Setup'}\n\n`;
            
            // Add active factions info
            response += '**Active Powers**\n';
            for (const faction of Object.values(factions)) {
                if (faction.isActive) {
                    response += `${faction.name}: ${faction.discordUsername || 'Unassigned'} (${faction.victoryPoints || 0} VP)\n`;
                }
            }
            
            // Add available powers info
            const availablePowers = Object.values(factions)
                .filter(f => !f.isActive)
                .map(f => f.name);

            if (availablePowers.length > 0) {
                response += '\n**Available Powers**\n';
                response += availablePowers.map(power => `- ${power}`).join('\n');
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
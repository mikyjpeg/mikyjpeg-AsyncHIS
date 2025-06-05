const { SlashCommandBuilder } = require('discord.js');
const { POWERS } = require('../../game/gameState');
const statusManager = require('../../game/statusManager');
const factionManager = require('../../game/factionManager');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Start a new game'),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            // Get the channel name
            const channelName = interaction.channel.name;

            // Get the managers for this game
            const sm = statusManager(channelName);
            const fm = factionManager(channelName);

            // Initialize game status
            await sm.initializeGame();

            // Initialize factions
            for (const power of Object.values(POWERS)) {
                await fm.initializeFaction(power);
            }

            const response = `Game started! Available powers:\n${Object.values(POWERS).map(power => `- ${power}`).join('\n')}\nUse /join [power] to join the game.`;
            await interaction.editReply(response);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to start game: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
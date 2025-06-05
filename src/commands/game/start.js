const { SlashCommandBuilder } = require('discord.js');
const { GameState, POWERS } = require('../../game/gameState');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Start a new game'),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        console.log('Starting new game...');
        const gameState = GameState(interaction.channelId);
        await gameState.startGame();
        
        const response = `Game started! Available powers:\n${Object.values(POWERS).map(power => `- ${power}`).join('\n')}\nUse /join [power] to join the game.`;
        await interaction.editReply(response);
    }
}; 
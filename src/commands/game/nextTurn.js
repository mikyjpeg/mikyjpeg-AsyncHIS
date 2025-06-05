const { SlashCommandBuilder } = require('discord.js');
const { GameState } = require('../../game/gameState');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('next_turn')
        .setDescription('Advance to the next turn'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const gameState = GameState(interaction.channelId);
            const status = await gameState.getGameStatus();
            const newTurn = status.turn + 1;
            
            if (newTurn > 9) {
                await interaction.editReply('Cannot advance beyond turn 9!');
                return;
            }

            await gameState.nextTurn();
            await interaction.editReply(`Advanced to turn ${newTurn}!`);
        } catch (error) {
            await interaction.editReply(`Failed to advance turn: ${error.message}`);
        }
    }
}; 
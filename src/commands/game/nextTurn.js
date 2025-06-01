const { SlashCommandBuilder } = require('discord.js');
const { GameState } = require('../../game/gameState');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('next_turn')
        .setDescription('Advance to the next turn'),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            const gameState = await GameState.load();
            const previousTurn = gameState.turn || 1;
            
            // Advance the turn
            gameState.turn = (gameState.turn || 1) + 1;
            await GameState.save(gameState);
            
            // Record in history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.NEXT_TURN,
                {
                    previousTurn,
                    newTurn: gameState.turn
                }
            );

            await interaction.editReply(`Advanced from turn ${previousTurn} to turn ${gameState.turn} (Command ID: ${historyEntry.commandId})`);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to advance turn: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
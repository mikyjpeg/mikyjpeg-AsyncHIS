const { GameState, POWERS } = require('../../game/gameState');

module.exports = {
    name: 'start',
    description: 'Start a new game',
    usage: '!start',
    async execute(message, args) {
        console.log('Starting new game...');
        await GameState.startGame();
        return `Game started! Available powers:\n${Object.values(POWERS).map(power => `- ${power}`).join('\n')}\nUse !join [power] to join the game.`;
    }
}; 
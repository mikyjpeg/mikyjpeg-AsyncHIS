const { GameState } = require('../../game/gameState');

module.exports = {
    name: 'status',
    description: 'Show current game status',
    usage: '!status',
    async execute(message, args) {
        console.log('Processing status command...');
        const status = await GameState.getGameStatus();
        const activePlayers = Object.values(status.factions)
            .filter(f => f.isActive)
            .map(f => `${f.discordUsername} as ${f.name}`)
            .join('\n');
        
        return `Game Status:
Turn: ${status.turn}
Phase: ${status.phase}
Current Player: ${status.activePlayer || 'None'}

Current Powers:
${activePlayers || 'No powers claimed'}

Available Powers:
${status.availablePowers.map(power => `- ${power}`).join('\n')}`;
    }
}; 
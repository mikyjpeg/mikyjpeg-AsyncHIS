const { GameState } = require('../../game/gameState');

module.exports = {
    name: 'join',
    description: 'Join the game as a power',
    usage: '!join [power]',
    async execute(message, args) {
        if (args.length < 1) {
            return `Please specify a power. Available powers:\n${GameState.availablePowers.map(power => `- ${power}`).join('\n')}`;
        }

        const powerInput = args.join(' ').replace(/[\[\]]/g, '');
        const powerName = powerInput.charAt(0).toUpperCase() + powerInput.slice(1).toLowerCase();
        console.log(`User ${message.author.username} attempting to join as ${powerName}`);
        
        await GameState.assignPower(message.author.id, message.author.username, powerName);
        console.log(`Successfully assigned ${powerName} to ${message.author.username}`);
        
        return `Successfully assigned ${powerName} to ${message.author.username}`;
    }
}; 
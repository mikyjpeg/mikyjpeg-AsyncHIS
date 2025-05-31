const { GameState } = require('../../game/gameState');

module.exports = {
    name: 'leave',
    description: 'Give up control of a power',
    usage: '!leave [power]',
    async execute(message, args) {
        if (args.length < 1) {
            return 'Please specify the power you want to give up';
        }

        const powerInput = args.join(' ').replace(/[\[\]]/g, '');
        const powerName = powerInput.charAt(0).toUpperCase() + powerInput.slice(1).toLowerCase();
        console.log(`User ${message.author.username} attempting to leave ${powerName}`);
        
        await GameState.leavePower(message.author.id, powerName);
        console.log(`Successfully removed ${message.author.username} from ${powerName}`);
        
        return `Successfully removed ${message.author.username} from ${powerName}`;
    }
}; 
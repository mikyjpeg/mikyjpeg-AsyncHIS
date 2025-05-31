const diplomacyManager = require('../../game/diplomacyManager');

module.exports = {
    name: 'break_alliance',
    description: 'Break an alliance between two powers',
    usage: '!break_alliance [power1] [power2]',
    async execute(message, args) {
        if (args.length < 2) {
            throw new Error('Please specify both powers. Usage: !break_alliance [power1] [power2]');
        }

        const power1 = args[0];
        const power2 = args[1];
        console.log(`Attempting to break alliance between ${power1} and ${power2}`);
        
        await diplomacyManager.removeAlliance(power1, power2);
        return `Alliance broken between ${power1} and ${power2}!`;
    }
}; 
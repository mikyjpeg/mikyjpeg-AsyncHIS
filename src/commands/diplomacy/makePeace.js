const diplomacyManager = require('../../game/diplomacyManager');

module.exports = {
    name: 'make_peace',
    description: 'Make peace between two powers',
    usage: '!make_peace [power1] [power2]',
    async execute(message, args) {
        if (args.length < 2) {
            throw new Error('Please specify both powers. Usage: !make_peace [power1] [power2]');
        }

        const power1 = args[0];
        const power2 = args[1];
        console.log(`Attempting to make peace between ${power1} and ${power2}`);
        
        await diplomacyManager.makePeace(power1, power2);
        return `Peace established between ${power1} and ${power2}!`;
    }
}; 
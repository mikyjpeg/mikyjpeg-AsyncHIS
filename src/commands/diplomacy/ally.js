const diplomacyManager = require('../../game/diplomacyManager');

module.exports = {
    name: 'ally',
    description: 'Form an alliance between two powers',
    usage: '!ally [power1] [power2]',
    async execute(message, args) {
        if (args.length < 2) {
            throw new Error('Please specify both powers. Usage: !ally [power1] [power2]');
        }

        const power1 = args[0];
        const power2 = args[1];
        console.log(`Attempting to form alliance between ${power1} and ${power2}`);
        
        await diplomacyManager.declareAlliance(power1, power2);
        return `Alliance formed between ${power1} and ${power2}!`;
    }
}; 
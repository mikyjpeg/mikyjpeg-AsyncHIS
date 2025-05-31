const diplomacyManager = require('../../game/diplomacyManager');

module.exports = {
    name: 'declare_war',
    description: 'Declare war between two powers',
    usage: '!declare_war [power1] [power2]',
    async execute(message, args) {
        if (args.length < 2) {
            throw new Error('Please specify both powers. Usage: !declare_war [power1] [power2]');
        }

        const power1 = args[0];
        const power2 = args[1];
        console.log(`Attempting to declare war between ${power1} and ${power2}`);
        
        await diplomacyManager.declareWar(power1, power2);
        return `War declared between ${power1} and ${power2}!`;
    }
}; 
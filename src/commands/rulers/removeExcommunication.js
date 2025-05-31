const rulerManager = require('../../game/rulerManager');

module.exports = {
    name: 'remove_excommunication',
    description: 'Remove excommunication from a ruler',
    usage: '!remove_excommunication [ruler_name]',
    async execute(message, args) {
        if (args.length < 1) {
            throw new Error('Please specify the ruler name. Usage: !remove_excommunication [ruler_name]');
        }

        const rulerName = args.join(' ');

        // Remove excommunication
        await rulerManager.removeExcommunication(rulerName);
        return `Excommunication has been removed from ${rulerName}`;
    }
}; 
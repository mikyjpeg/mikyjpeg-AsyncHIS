const rulerManager = require('../../game/rulerManager');

module.exports = {
    name: 'excommunicate',
    description: 'Excommunicate a ruler',
    usage: '!excommunicate [ruler_name]',
    async execute(message, args) {
        if (args.length < 1) {
            throw new Error('Please specify the ruler name. Usage: !excommunicate [ruler_name]');
        }

        const rulerName = args.join(' ');

        // Check if excommunication is possible and get the reason
        const validation = await rulerManager.canBeExcommunicated(rulerName);
        if (!validation.valid) {
            return validation.reason;
        }

        // Perform excommunication
        await rulerManager.excommunicate(rulerName);
        return `${rulerName} has been excommunicated. Reason: ${validation.reason}`;
    }
}; 
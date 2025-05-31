const rulerManager = require('../../game/rulerManager');
const { commandHistory, COMMAND_TYPES, createHistoryEntry } = require('../../game/commandHistoryManager');

module.exports = {
    name: 'excommunicate',
    description: 'Excommunicate a ruler',
    usage: '!excommunicate [ruler_name]',
    async execute(message, args) {
        if (args.length < 1) {
            throw new Error('Please specify the ruler name. Usage: !excommunicate [ruler_name]');
        }

        const rulerName = args.join(' ');

        try {
            // Check if excommunication is possible and get the reason
            const validation = await rulerManager.canBeExcommunicated(rulerName);
            if (!validation.valid) {
                // Record failed attempt in history
                await commandHistory.addToHistory(
                    createHistoryEntry(COMMAND_TYPES.EXCOMMUNICATION, { rulerName }),
                    message.author.username,
                    false,
                    validation.reason
                );
                return validation.reason;
            }

            // Perform excommunication
            const result = await rulerManager.excommunicate(rulerName);
            
            // Record successful command in history
            const historyEntry = await commandHistory.addToHistory(
                createHistoryEntry(COMMAND_TYPES.EXCOMMUNICATION, { ruler: result.ruler }),
                message.author.username
            );

            return `${rulerName} has been excommunicated (Command ID: ${historyEntry.commandId}). Reason: ${validation.reason}\nFaction ${result.ruler.faction}'s card modifier changed by ${result.cardModifierChange} (new value: ${result.newCardModifier})`;
        } catch (error) {
            // Record error in history
            await commandHistory.addToHistory(
                createHistoryEntry(COMMAND_TYPES.EXCOMMUNICATION, { rulerName }),
                message.author.username,
                false,
                error.message
            );
            throw error;
        }
    }
}; 
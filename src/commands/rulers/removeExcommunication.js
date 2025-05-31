const rulerManager = require('../../game/rulerManager');
const { commandHistory, COMMAND_TYPES, createHistoryEntry } = require('../../game/commandHistoryManager');

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
        const result = await rulerManager.removeExcommunication(rulerName);
        
        // Record in history
        commandHistory.addToHistory(createHistoryEntry(COMMAND_TYPES.REMOVE_EXCOMMUNICATION, {
            ruler: result.ruler
        }));

        return `Excommunication has been removed from ${rulerName}\nFaction ${result.ruler.faction}'s card modifier changed by ${result.cardModifierChange} (new value: ${result.newCardModifier})`;
    }
}; 
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
        const commandString = `!remove_excommunication ${rulerName}`;

        try {
            // Remove excommunication
            const result = await rulerManager.removeExcommunication(rulerName);
            
            // Record successful command in history
            const historyEntry = await commandHistory.addToHistory(
                createHistoryEntry(COMMAND_TYPES.REMOVE_EXCOMMUNICATION, { ruler: result.ruler }),
                message.author.username,
                commandString
            );

            return `Excommunication has been removed from ${rulerName}\nFaction ${result.ruler.faction}'s card modifier changed by ${result.cardModifierChange} (new value: ${result.newCardModifier})`;
        } catch (error) {
            // Record error in history
            await commandHistory.addToHistory(
                createHistoryEntry(COMMAND_TYPES.REMOVE_EXCOMMUNICATION, { rulerName }),
                message.author.username,
                commandString,
                false,
                error.message
            );
            throw error;
        }
    }
}; 
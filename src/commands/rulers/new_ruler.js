const rulerSuccessionManager = require('../../game/rulerSuccessionManager');
const { commandHistory, COMMAND_TYPES, createHistoryEntry } = require('../../game/commandHistoryManager');

module.exports = {
    name: 'new_ruler',
    description: 'Change the current ruler of a faction to their successor',
    usage: '!new_ruler [faction]',
    async execute(message, args) {
        if (args.length < 1) {
            const validFactions = rulerSuccessionManager.getValidFactions();
            throw new Error(`Please specify the faction name. Valid factions are: ${validFactions.join(', ')}\nUsage: !new_ruler [faction]`);
        }

        const faction = args.join(' ');
        const commandString = `!new_ruler ${faction}`;
        
        try {
            // Validate faction
            if (!rulerSuccessionManager.isValidFaction(faction)) {
                const validFactions = rulerSuccessionManager.getValidFactions();
                // Record failed attempt in history
                await commandHistory.addToHistory(
                    createHistoryEntry(COMMAND_TYPES.RULER_CHANGE, { faction }),
                    message.author.username,
                    commandString,
                    false,
                    `Invalid faction. Valid factions are: ${validFactions.join(', ')}`
                );
                throw new Error(`Invalid faction. Valid factions are: ${validFactions.join(', ')}`);
            }

            // Perform ruler change
            const result = await rulerSuccessionManager.changeRuler(faction);
            
            // Record successful command in history
            const historyEntry = await commandHistory.addToHistory(
                createHistoryEntry(COMMAND_TYPES.RULER_CHANGE, {
                    oldRuler: result.oldRuler,
                    newRuler: result.newRuler
                }),
                message.author.username,
                commandString
            );
            
            return `Ruler change successful for ${faction} (Command ID: ${historyEntry.commandId}):\n${result.oldRuler.name} -> ${result.newRuler.name}`;
        } catch (error) {
            // If not already recorded (like for invalid faction)
            if (!error.message.includes('Invalid faction')) {
                // Record error in history
                await commandHistory.addToHistory(
                    createHistoryEntry(COMMAND_TYPES.RULER_CHANGE, { faction }),
                    message.author.username,
                    commandString,
                    false,
                    error.message
                );
            }
            throw error;
        }
    }
}; 
const rulerSuccessionManager = require('../../game/rulerSuccessionManager');
const { commandHistory, COMMAND_TYPES, createHistoryEntry } = require('../../game/commandHistoryManager');

module.exports = {
    name: 'new_ruler',
    description: 'Change the current ruler of a faction to their successor. For England, you must specify the successor: !new_ruler England [successor_name]',
    usage: '!new_ruler [faction] [successor_name?]',
    async execute(message, args) {
        if (args.length < 1) {
            const validFactions = rulerSuccessionManager.getValidFactions();
            throw new Error(`Please specify the faction name. Valid factions are: ${validFactions.join(', ')}\nUsage: !new_ruler [faction] [successor_name?]`);
        }

        const faction = args[0];
        const successor = args.length > 1 ? args.slice(1).join(' ') : null;
        const commandString = `!new_ruler ${faction}${successor ? ' ' + successor : ''}`;
        
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

            // Get current ruler to check valid successors
            const currentRuler = await rulerSuccessionManager.getCurrentRuler(faction);

            // If faction requires successor but none specified, show valid options
            if (rulerSuccessionManager.requiresSuccessorSpecification(faction) && !successor) {
                const validSuccessors = await rulerSuccessionManager.getValidSuccessors(faction, currentRuler.name);
                const errorMsg = `For ${faction}, you must specify the successor. Valid successors for ${currentRuler.name} are: ${validSuccessors.join(', ')}`;
                
                // Record failed attempt in history
                await commandHistory.addToHistory(
                    createHistoryEntry(COMMAND_TYPES.RULER_CHANGE, { 
                        faction,
                        currentRuler: currentRuler.name
                    }),
                    message.author.username,
                    commandString,
                    false,
                    errorMsg
                );
                throw new Error(errorMsg);
            }

            // Perform ruler change
            const result = await rulerSuccessionManager.changeRuler(faction, successor);
            
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
            // If not already recorded (like for invalid faction or missing successor)
            if (!error.message.includes('Invalid faction') && !error.message.includes('must specify the successor')) {
                // Record error in history
                await commandHistory.addToHistory(
                    createHistoryEntry(COMMAND_TYPES.RULER_CHANGE, { faction, successor }),
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
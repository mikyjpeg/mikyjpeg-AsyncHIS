const rulerSuccessionManager = require('../../game/rulerSuccessionManager');
const { commandHistory, COMMAND_TYPES, createHistoryEntry } = require('../../game/commandHistoryManager');

module.exports = {
    name: 'newRuler',
    description: 'Change the current ruler of a faction to their successor',
    usage: '!newRuler [faction]',
    async execute(message, args) {
        if (args.length < 1) {
            const validFactions = rulerSuccessionManager.getValidFactions();
            throw new Error(`Please specify the faction name. Valid factions are: ${validFactions.join(', ')}\nUsage: !newRuler [faction]`);
        }

        const faction = args.join(' ');
        
        // Validate faction
        if (!rulerSuccessionManager.isValidFaction(faction)) {
            const validFactions = rulerSuccessionManager.getValidFactions();
            throw new Error(`Invalid faction. Valid factions are: ${validFactions.join(', ')}`);
        }

        // Perform ruler change
        const result = await rulerSuccessionManager.changeRuler(faction);
        
        // Record in history
        commandHistory.addToHistory(createHistoryEntry(COMMAND_TYPES.RULER_CHANGE, {
            oldRuler: result.oldRuler,
            newRuler: result.newRuler
        }));
        
        return `Ruler change successful for ${faction}:\n${result.oldRuler.name} -> ${result.newRuler.name}`;
    }
}; 
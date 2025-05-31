const formationManager = require('../../game/formationManager');
const { commandHistory, COMMAND_TYPES, createHistoryEntry } = require('../../game/commandHistoryManager');

module.exports = {
    name: 'remove_formation',
    description: 'Remove troops and/or leaders from a formation in a space. For Ottoman: [regular_troops] [cavalry]. For others: [regular_troops] [mercenaries].',
    usage: '!remove_formation [space_name] [power] [regular_troops] [mercenaries/cavalry] [...leaders]',
    async execute(message, args) {
        if (args.length < 4) {
            throw new Error('Please provide space name, power, regular troops, and mercenaries/cavalry. Usage: !remove_formation [space_name] [power] [regular_troops] [mercenaries/cavalry] [...leaders]');
        }

        const spaceName = args[0];
        const power = args[1];
        const regularTroops = parseInt(args[2]);
        const secondaryTroops = parseInt(args[3]);
        const leaders = args.slice(4);
        
        const commandString = `!remove_formation ${args.join(' ')}`;

        try {
            // Remove from formation
            const updatedSpace = await formationManager.removeFormation(spaceName, power, regularTroops, secondaryTroops, leaders);
            
            // Record in history
            const historyEntry = await commandHistory.addToHistory(
                createHistoryEntry(COMMAND_TYPES.REMOVE_FORMATION, {
                    spaceName,
                    formation: {
                        power,
                        regularTroops,
                        secondaryTroops,
                        leaders
                    }
                }),
                message.author.username,
                commandString
            );

            // Check if the formation still exists
            const remainingFormation = updatedSpace.formations.find(f => f.power === power);
            let statusMessage;
            
            if (remainingFormation) {
                const troopInfo = power === 'Ottoman' ?
                    `${remainingFormation.regulars} regulars and ${remainingFormation.cavalry} cavalry remaining` :
                    `${remainingFormation.regulars} regulars and ${remainingFormation.mercenaries} mercenaries remaining`;
                const leaderInfo = remainingFormation.leaders.length > 0 ? 
                    `\nRemaining leaders: ${remainingFormation.leaders.join(', ')}` : '';
                statusMessage = `${remainingFormation.power}: ${troopInfo}${leaderInfo}`;
            } else {
                statusMessage = `${power} formation completely removed`;
            }

            return `Removed from ${spaceName} (Command ID: ${historyEntry.commandId}):\n` +
                   `${power === 'Ottoman' ? 
                       `${regularTroops} regulars and ${secondaryTroops} cavalry` :
                       `${regularTroops} regulars and ${secondaryTroops} mercenaries`}` +
                   `${leaders.length > 0 ? ` and leaders: ${leaders.join(', ')}` : ''}\n` +
                   statusMessage;
        } catch (error) {
            // Record error in history
            await commandHistory.addToHistory(
                createHistoryEntry(COMMAND_TYPES.REMOVE_FORMATION, {
                    spaceName,
                    formation: {
                        power,
                        regularTroops,
                        secondaryTroops,
                        leaders
                    }
                }),
                message.author.username,
                commandString,
                false,
                error.message
            );
            throw error;
        }
    }
}; 
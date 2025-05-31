const formationManager = require('../../game/formationManager');
const { commandHistory, COMMAND_TYPES, createHistoryEntry } = require('../../game/commandHistoryManager');

module.exports = {
    name: 'add_formation',
    description: 'Add a formation to a space. For Ottoman: [regular_troops] [cavalry]. For others: [regular_troops] [mercenaries].',
    usage: '!add_formation [space_name] [power] [regular_troops] [mercenaries/cavalry] [...leaders]',
    async execute(message, args) {
        if (args.length < 4) {
            throw new Error('Please provide space name, power, regular troops, and mercenaries/cavalry. Usage: !add_formation [space_name] [power] [regular_troops] [mercenaries/cavalry] [...leaders]');
        }

        const spaceName = args[0];
        const power = args[1];
        const regularTroops = parseInt(args[2]);
        const secondaryTroops = parseInt(args[3]);
        const leaders = args.slice(4);
        
        const commandString = `!add_formation ${args.join(' ')}`;

        try {
            // Add the formation
            const updatedSpace = await formationManager.addFormation(spaceName, power, regularTroops, secondaryTroops, leaders);
            
            // Record in history
            const historyEntry = await commandHistory.addToHistory(
                createHistoryEntry(COMMAND_TYPES.ADD_FORMATION, {
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

            // Format the formation details for display
            const formation = updatedSpace.formations.find(f => f.power === power);
            const troopInfo = power === 'Ottoman' ?
                `${formation.regulars} regulars and ${formation.cavalry} cavalry` :
                `${formation.regulars} regulars and ${formation.mercenaries} mercenaries`;
            const leaderInfo = formation.leaders.length > 0 ? ` with leaders: ${formation.leaders.join(', ')}` : '';
            
            return `Added formation to ${spaceName} (Command ID: ${historyEntry.commandId}):\n` +
                   `${formation.power}: ${troopInfo}${leaderInfo}`;
        } catch (error) {
            // Record error in history
            await commandHistory.addToHistory(
                createHistoryEntry(COMMAND_TYPES.ADD_FORMATION, {
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
const formationManager = require('../../game/formationManager');
const { commandHistory, COMMAND_TYPES, createHistoryEntry } = require('../../game/commandHistoryManager');

module.exports = {
    name: 'add_formation',
    description: 'Add a formation to a space. Leaders are optional.',
    usage: '!add_formation [space_name] [power] [troops] [...leaders]',
    async execute(message, args) {
        if (args.length < 3) {
            throw new Error('Please provide space name, power, and number of troops. Usage: !add_formation [space_name] [power] [troops] [...leaders]');
        }

        const spaceName = args[0];
        const power = args[1];
        const troops = parseInt(args[2]);
        const leaders = args.slice(3);
        
        const commandString = `!add_formation ${args.join(' ')}`;

        try {
            // Add the formation
            const updatedSpace = await formationManager.addFormation(spaceName, power, troops, leaders);
            
            // Record in history
            const historyEntry = await commandHistory.addToHistory(
                createHistoryEntry(COMMAND_TYPES.ADD_FORMATION, {
                    spaceName,
                    formation: {
                        power,
                        troops,
                        leaders
                    }
                }),
                message.author.username,
                commandString
            );

            // Format the formation details for display
            const formation = updatedSpace.formations.find(f => f.power === power);
            const leaderInfo = formation.leaders.length > 0 ? ` with leaders: ${formation.leaders.join(', ')}` : '';
            
            return `Added formation to ${spaceName} (Command ID: ${historyEntry.commandId}):\n` +
                   `${formation.power}: ${formation.troops} troops${leaderInfo}`;
        } catch (error) {
            // Record error in history
            await commandHistory.addToHistory(
                createHistoryEntry(COMMAND_TYPES.ADD_FORMATION, {
                    spaceName,
                    formation: {
                        power,
                        troops,
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
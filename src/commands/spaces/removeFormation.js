const formationManager = require('../../game/formationManager');
const { commandHistory, COMMAND_TYPES, createHistoryEntry } = require('../../game/commandHistoryManager');

module.exports = {
    name: 'remove_formation',
    description: 'Remove troops and/or leaders from a formation in a space',
    usage: '!remove_formation [space_name] [power] [troops] [...leaders]',
    async execute(message, args) {
        if (args.length < 3) {
            throw new Error('Please provide space name, power, and number of troops. Usage: !remove_formation [space_name] [power] [troops] [...leaders]');
        }

        const spaceName = args[0];
        const power = args[1];
        const troops = parseInt(args[2]);
        const leaders = args.slice(3);
        
        const commandString = `!remove_formation ${args.join(' ')}`;

        try {
            // Remove the formation
            const updatedSpace = await formationManager.removeFormation(spaceName, power, troops, leaders);
            
            // Record in history
            const historyEntry = await commandHistory.addToHistory(
                createHistoryEntry(COMMAND_TYPES.REMOVE_FORMATION, {
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

            // Check if the formation still exists
            const remainingFormation = updatedSpace.formations.find(f => f.power === power);
            let statusMessage;
            
            if (remainingFormation) {
                const leaderInfo = remainingFormation.leaders.length > 0 ? 
                    `\nRemaining leaders: ${remainingFormation.leaders.join(', ')}` : '';
                statusMessage = `${remainingFormation.power}: ${remainingFormation.troops} troops remaining${leaderInfo}`;
            } else {
                statusMessage = `${power} formation completely removed`;
            }

            return `Removed from ${spaceName} (Command ID: ${historyEntry.commandId}):\n` +
                   `${troops} troops${leaders.length > 0 ? ` and leaders: ${leaders.join(', ')}` : ''}\n` +
                   statusMessage;
        } catch (error) {
            // Record error in history
            await commandHistory.addToHistory(
                createHistoryEntry(COMMAND_TYPES.REMOVE_FORMATION, {
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
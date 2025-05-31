const leaderManager = require('../../game/leaderManager');
const { commandHistory, COMMAND_TYPES, createHistoryEntry } = require('../../game/commandHistoryManager');

module.exports = {
    name: 'capture_leader',
    description: 'Capture a leader and add them to a faction\'s captives.',
    usage: '!capture_leader [leader_name] [capturing_faction]',
    async execute(message, args) {
        if (args.length < 2) {
            throw new Error('Please provide leader name and capturing faction. Usage: !capture_leader [leader_name] [capturing_faction]');
        }

        const leaderName = args[0];
        const capturingFaction = args[1];
        
        const commandString = `!capture_leader ${args.join(' ')}`;

        try {
            // Capture the leader
            const { leader, faction } = await leaderManager.captureLeader(leaderName, capturingFaction);
            
            // Record in history
            const historyEntry = await commandHistory.addToHistory(
                createHistoryEntry(COMMAND_TYPES.CAPTURE_LEADER, {
                    leaderName,
                    capturingFaction
                }),
                message.author.username,
                commandString
            );

            return `${leader.name} has been captured by ${faction.name} (Command ID: ${historyEntry.commandId})`;
        } catch (error) {
            // Record error in history
            await commandHistory.addToHistory(
                createHistoryEntry(COMMAND_TYPES.CAPTURE_LEADER, {
                    leaderName,
                    capturingFaction
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
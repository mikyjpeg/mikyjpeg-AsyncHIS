const leaderManager = require('../../game/leaderManager');
const { commandHistory, COMMAND_TYPES, createHistoryEntry } = require('../../game/commandHistoryManager');

module.exports = {
    name: 'release_leader',
    description: 'Release a captured leader from a faction\'s captives.',
    usage: '!release_leader [leader_name] [releasing_faction]',
    async execute(message, args) {
        if (args.length < 2) {
            throw new Error('Please provide leader name and releasing faction. Usage: !release_leader [leader_name] [releasing_faction]');
        }

        const leaderName = args[0];
        const releasingFaction = args[1];
        
        const commandString = `!release_leader ${args.join(' ')}`;

        try {
            // Release the leader
            const { leader, faction } = await leaderManager.releaseLeader(leaderName, releasingFaction);
            
            // Record in history
            const historyEntry = await commandHistory.addToHistory(
                createHistoryEntry(COMMAND_TYPES.RELEASE_LEADER, {
                    leaderName,
                    releasingFaction
                }),
                message.author.username,
                commandString
            );

            return `${leader.name} has been released by ${faction.name} (Command ID: ${historyEntry.commandId})`;
        } catch (error) {
            // Record error in history
            await commandHistory.addToHistory(
                createHistoryEntry(COMMAND_TYPES.RELEASE_LEADER, {
                    leaderName,
                    releasingFaction
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
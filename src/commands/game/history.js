const { commandHistory } = require('../../game/commandHistoryManager');

module.exports = {
    name: 'history',
    description: 'View command history. Use !history [limit?] to see only the last N commands',
    usage: '!history [limit?]',
    async execute(message, args) {
        try {
            const limit = args.length > 0 ? parseInt(args[0]) : null;
            const history = await commandHistory.getCommandHistory(limit);

            if (history.length === 0) {
                return 'No commands in history';
            }

            // Format the history entries
            const formattedHistory = history.map(entry => {
                const date = new Date(entry.timestamp).toLocaleString();
                const status = entry.undone ? 'UNDONE' : (entry.success ? 'SUCCESS' : 'ERROR');
                const error = entry.errorMessage ? `\n    Error: ${entry.errorMessage}` : '';
                
                return `[${entry.commandId}] ${date} - ${entry.username}\n` +
                       `    Command: ${entry.command}\n` +
                       `    Type: ${entry.type}\n` +
                       `    Status: ${status}${error}`;
            }).join('\n\n');

            return `Command History:\n${formattedHistory}`;
        } catch (error) {
            throw new Error(`Failed to retrieve command history: ${error.message}`);
        }
    }
}; 
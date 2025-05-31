const fs = require('fs').promises;
const path = require('path');

class CommandHistoryManager {
    constructor() {
        this.auditFilePath = path.join(__dirname, '../../data/command_history.json');
        this.lastCommandId = 0;
        this.initializeAuditFile();
    }

    async initializeAuditFile() {
        try {
            // Try to read the existing file to get the last command ID
            const history = await this.readAuditFile();
            if (history.length > 0) {
                this.lastCommandId = history[history.length - 1].commandId;
            }
        } catch (error) {
            // If file doesn't exist, create it with empty array
            await this.writeAuditFile([]);
        }
    }

    async readAuditFile() {
        const data = await fs.readFile(this.auditFilePath, 'utf8');
        return JSON.parse(data);
    }

    async writeAuditFile(history) {
        await fs.writeFile(this.auditFilePath, JSON.stringify(history, null, 2));
    }

    async addToHistory(commandEntry, username, commandString, success = true, errorMessage = null) {
        const history = await this.readAuditFile();
        this.lastCommandId++;

        const auditEntry = {
            commandId: this.lastCommandId,
            timestamp: new Date().toISOString(),
            username,
            command: commandString,
            type: commandEntry.type,
            data: commandEntry.data,
            success,
            errorMessage,
            undone: false
        };

        history.push(auditEntry);
        await this.writeAuditFile(history);
        return auditEntry;
    }

    async getLastCommand() {
        const history = await this.readAuditFile();
        // Filter out undone commands and get the last one
        const validCommands = history.filter(cmd => !cmd.undone);
        
        if (validCommands.length === 0) {
            throw new Error('No commands in history to undo');
        }
        
        return validCommands[validCommands.length - 1];
    }

    async getCommand(commandId) {
        const history = await this.readAuditFile();
        const command = history.find(cmd => cmd.commandId === commandId && !cmd.undone);
        
        if (!command) {
            throw new Error(`Command with ID ${commandId} not found or already undone`);
        }
        
        return command;
    }

    async markCommandAsUndone(commandId) {
        const history = await this.readAuditFile();
        const commandIndex = history.findIndex(cmd => cmd.commandId === commandId);
        
        if (commandIndex === -1) {
            throw new Error(`Command with ID ${commandId} not found`);
        }

        history[commandIndex].undone = true;
        await this.writeAuditFile(history);
    }

    async getCommandHistory(limit = null) {
        const history = await this.readAuditFile();
        if (limit) {
            return history.slice(-limit);
        }
        return history;
    }
}

// Command entry structure for different command types
const COMMAND_TYPES = {
    EXCOMMUNICATION: 'excommunication',
    REMOVE_EXCOMMUNICATION: 'remove_excommunication',
    RULER_CHANGE: 'ruler_change'
};

// Factory for creating command history entries
function createHistoryEntry(type, data) {
    return {
        type,
        data
    };
}

module.exports = {
    commandHistory: new CommandHistoryManager(),
    COMMAND_TYPES,
    createHistoryEntry
}; 
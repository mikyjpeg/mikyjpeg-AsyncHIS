const fs = require('fs').promises;
const path = require('path');
const { FILE_SYSTEM } = require('../utils/constants');
const { getGamePath } = require('../utils/gamePathUtils');

class CommandHistoryManager {
    constructor(channelId) {
        if (!channelId) throw new Error('Channel ID is required');
        this.auditFilePath = path.join(process.cwd(), getGamePath(channelId), 'command_history.json');
        this.lastCommandId = 0;
        this.initialized = false;
    }

    async initialize() {
        if (!this.initialized) {
            try {
                // Try to read the existing file to get the last command ID
                const history = await this.readAuditFile();
                if (history.length > 0) {
                    // Find the highest command ID in case commands were deleted
                    this.lastCommandId = Math.max(...history.map(cmd => cmd.commandId));
                }
                this.initialized = true;
            } catch (error) {
                // If file doesn't exist, create it with empty array
                await this.writeAuditFile([]);
                this.initialized = true;
            }
        }
    }

    async readAuditFile() {
        const data = await fs.readFile(this.auditFilePath, 'utf8');
        return JSON.parse(data);
    }

    async writeAuditFile(history) {
        await fs.writeFile(this.auditFilePath, JSON.stringify(history, null, FILE_SYSTEM.JSON_INDENT));
    }

    async addToHistory(commandEntry, username, commandString, success = true, errorMessage = null) {
        await this.initialize();
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
        await this.initialize();
        const history = await this.readAuditFile();
        // Filter out undone commands and get the last one
        const validCommands = history.filter(cmd => !cmd.undone);
        
        if (validCommands.length === 0) {
            throw new Error('No commands in history to undo');
        }
        
        return validCommands[validCommands.length - 1];
    }

    async getCommand(commandId) {
        await this.initialize();
        const history = await this.readAuditFile();
        const command = history.find(cmd => cmd.commandId === commandId && !cmd.undone);
        
        if (!command) {
            throw new Error(`Command with ID ${commandId} not found or already undone`);
        }
        
        return command;
    }

    async markCommandAsUndone(commandId) {
        await this.initialize();
        const history = await this.readAuditFile();
        const commandIndex = history.findIndex(cmd => cmd.commandId === commandId);
        
        if (commandIndex === -1) {
            throw new Error(`Command with ID ${commandId} not found`);
        }

        history[commandIndex].undone = true;
        await this.writeAuditFile(history);
    }

    async getCommandHistory(limit = null) {
        await this.initialize();
        const history = await this.readAuditFile();
        if (limit) {
            return history.slice(-limit);
        }
        return history;
    }

    // Helper function for slash commands to record history
    async recordSlashCommand(interaction, type, data, success = true, errorMessage = null) {
        const commandString = `/${interaction.commandName} ${interaction.options.data.map(opt => `${opt.name}:${opt.value}`).join(' ')}`;
        
        return await this.addToHistory(
            createHistoryEntry(type, data),
            interaction.user.username,
            commandString,
            success,
            errorMessage
        );
    }
}

// Command entry structure for different command types
const COMMAND_TYPES = {
    EXCOMMUNICATION: 'excommunication',
    REMOVE_EXCOMMUNICATION: 'remove_excommunication',
    RULER_CHANGE: 'ruler_change',
    ADD_FORMATION: 'add_formation',
    REMOVE_FORMATION: 'remove_formation',
    CAPTURE_LEADER: 'capture_leader',
    RELEASE_LEADER: 'release_leader',
    CONVERT_SPACE: 'convert_space',
    ADD_JESUITE: 'add_jesuite',
    REMOVE_JESUITE: 'remove_jesuite',
    ADD_REFORMER: 'add_reformer',
    REMOVE_REFORMER: 'remove_reformer',
    MAKE_PEACE: 'make_peace',
    DECLARE_WAR: 'declare_war',
    FORM_ALLIANCE: 'form_alliance',
    TAKE_CONTROL: 'take_control',
    ADD_VP: 'add_vp',
    REMOVE_VP: 'remove_vp',
    SET_VP: 'set_vp',
    DEPLOY_ELECTORATE: 'deploy_electorate',
    SHUFFLE_DECK: 'shuffle_deck',
    DRAW_CARDS: 'draw_cards',
    PLAY_CARD: 'play_card',
    DISCARD_CARD: 'discard_card'
};

// Factory for creating command history entries
function createHistoryEntry(type, data) {
    return {
        type,
        data
    };
}

// Export factory functions
const createCommandHistoryManager = (channelId) => new CommandHistoryManager(channelId);

module.exports = {
    commandHistory: createCommandHistoryManager,
    COMMAND_TYPES,
    createHistoryEntry
}; 
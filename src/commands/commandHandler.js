const fs = require('fs').promises;
const path = require('path');

class CommandHandler {
    constructor() {
        this.commands = new Map();
        this.commandCategories = ['diplomacy', 'spaces', 'game', 'religion'];
    }

    async loadCommands() {
        for (const category of this.commandCategories) {
            const categoryPath = path.join(__dirname, category);
            try {
                const files = await fs.readdir(categoryPath);
                for (const file of files) {
                    if (!file.endsWith('.js')) continue;

                    const command = require(path.join(categoryPath, file));
                    this.commands.set(command.name, {
                        ...command,
                        category
                    });
                    console.log(`Loaded command: ${command.name} (${category})`);
                }
            } catch (error) {
                console.error(`Error loading commands from ${category}:`, error);
            }
        }
    }

    getCommand(name) {
        return this.commands.get(name);
    }

    async executeCommand(commandName, message, args) {
        const command = this.getCommand(commandName);
        if (!command) {
            throw new Error(`Command "${commandName}" not found`);
        }

        try {
            const response = await command.execute(message, args);
            return response;
        } catch (error) {
            console.error(`Error executing command ${commandName}:`, error);
            throw error;
        }
    }

    getCommandList() {
        const commandsByCategory = {};
        
        // Group commands by category
        for (const [name, command] of this.commands) {
            if (!commandsByCategory[command.category]) {
                commandsByCategory[command.category] = [];
            }
            commandsByCategory[command.category].push(`!${name} - ${command.description}`);
        }

        // Build the formatted list
        let commandList = [];
        for (const category of this.commandCategories) {
            if (commandsByCategory[category]) {
                commandList.push(`\n${category.charAt(0).toUpperCase() + category.slice(1)} Commands:`);
                commandList = commandList.concat(commandsByCategory[category].map(cmd => `  ${cmd}`));
            }
        }

        return commandList.join('\n');
    }
}

module.exports = new CommandHandler(); 
const fs = require('fs').promises;
const path = require('path');
const { Collection } = require('discord.js');

class CommandHandler {
    constructor() {
        this.commands = new Collection();
        this.commandCategories = ['diplomacy', 'spaces', 'game', 'religion', 'rulers', 'cards'];
    }

    async loadCommands() {
        for (const category of this.commandCategories) {
            const categoryPath = path.join(__dirname, category);
            try {
                const files = await fs.readdir(categoryPath);
                for (const file of files) {
                    if (!file.endsWith('.js')) continue;

                    const command = require(path.join(categoryPath, file));
                    if (!command.data) continue; // Skip if not a slash command
                    
                    this.commands.set(command.data.name, {
                        ...command,
                        category
                    });
                    
                    console.log(`Loaded command: ${command.data.name} (${category})`);
                }
            } catch (error) {
                console.error(`Error loading commands from ${category}:`, error);
            }
        }
    }

    async executeInteraction(interaction) {
        const command = this.commands.get(interaction.commandName);
        
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            await interaction.reply({ 
                content: 'There was an error while executing this command!', 
                ephemeral: true 
            });
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}:`, error);
            const errorMessage = { 
                content: 'There was an error while executing this command!', 
                ephemeral: true 
            };
            
            if (interaction.deferred) {
                await interaction.editReply(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }

    getCommandsByCategory() {
        const commandsByCategory = {};
        
        // Group commands by category
        for (const [name, command] of this.commands) {
            if (!commandsByCategory[command.category]) {
                commandsByCategory[command.category] = [];
            }
            
            commandsByCategory[command.category].push(`/${name} - ${command.data.description}`);
        }

        return commandsByCategory;
    }

    getCommandList() {
        const commandsByCategory = this.getCommandsByCategory();

        // Build the formatted list
        let commandList = [];
        for (const category of this.commandCategories) {
            if (commandsByCategory[category]) {
                commandList.push(`\n**${category.charAt(0).toUpperCase() + category.slice(1)} Commands:**`);
                commandList = commandList.concat(commandsByCategory[category].map(cmd => `  ${cmd}`));
                commandList.push(''); // Add empty line between categories
            }
        }

        return commandList.join('\n');
    }
}

module.exports = new CommandHandler(); 
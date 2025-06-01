const { REST, Routes } = require('discord.js');
const { token, clientId, commandConfig } = require('../config');
const fs = require('fs');
const path = require('path');

async function getCommands() {
    const commands = [];
    const commandsPath = path.join(__dirname, '../commands');
    
    // Recursively get all command files
    function getCommandFiles(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                getCommandFiles(filePath);
            } else if (file.endsWith('.js')) {
                const command = require(filePath);
                
                // Only add commands that have slash command data
                if (command.data) {
                    commands.push(command.data.toJSON());
                }
            }
        }
    }
    
    getCommandFiles(commandsPath);
    return commands;
}

async function deployCommands() {
    try {
        console.log('Started refreshing application (/) commands...');
        
        const commands = await getCommands();
        const rest = new REST().setToken(token);
        
        if (commandConfig.global) {
            // Global commands - will take up to 1 hour to update
            await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands },
            );
            console.log('Successfully registered global application commands.');
        } else {
            // Guild commands - instant update
            await rest.put(
                Routes.applicationGuildCommands(clientId, commandConfig.guildId),
                { body: commands },
            );
            console.log(`Successfully registered application commands for development guild ${commandConfig.guildId}`);
        }
    } catch (error) {
        console.error(error);
    }
}

module.exports = { deployCommands }; 
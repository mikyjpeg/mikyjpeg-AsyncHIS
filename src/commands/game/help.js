const { SlashCommandBuilder } = require('discord.js');
const commandHandler = require('../../commands/commandHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show list of available commands'),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            const commandsByCategory = commandHandler.getCommandsByCategory();
            let currentMessage = '**Here I Stand Bot Commands**\n\n';
            const messages = [];
            
            // Process each category
            for (const category of Object.keys(commandsByCategory)) {
                const categoryContent = `**${category.charAt(0).toUpperCase() + category.slice(1)} Commands:**\n${commandsByCategory[category].map(cmd => `  ${cmd}`).join('\n')}\n\n`;
                
                // If adding this category would exceed the limit, start a new message
                if (currentMessage.length + categoryContent.length > 1900) {
                    messages.push(currentMessage);
                    currentMessage = categoryContent;
                } else {
                    currentMessage += categoryContent;
                }
            }
            
            // Add the last message if it has content
            if (currentMessage) {
                messages.push(currentMessage);
            }
            
            // Send first message as reply
            await interaction.editReply(messages[0]);
            
            // Send follow-up messages
            for (let i = 1; i < messages.length; i++) {
                await interaction.followUp(messages[i]);
            }
        } catch (error) {
            console.error('Error in help command:', error);
            await interaction.editReply({ 
                content: `Failed to get command list: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
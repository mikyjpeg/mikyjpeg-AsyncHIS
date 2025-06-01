const { SlashCommandBuilder } = require('discord.js');
const commandHandler = require('../../commands/commandHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show list of available commands'),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            const helpMessage = `**Here I Stand Bot Commands**\n${commandHandler.getCommandList()}`;
            await interaction.editReply(helpMessage);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to get command list: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
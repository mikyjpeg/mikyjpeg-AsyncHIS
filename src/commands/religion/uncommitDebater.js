const { SlashCommandBuilder } = require('discord.js');
const debaterManager = require('../../game/debaterManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uncommit_debater')
        .setDescription('Uncommit a debater')
        .addStringOption(option =>
            option.setName('debater')
                .setDescription('Name of the debater')
                .setRequired(true)),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const debaterName = interaction.options.getString('debater');
        const channelName = interaction.channel.name;
        
        try {
            // Get the debater manager for this game
            const dm = debaterManager(channelName);

            // Get current state
            const oldState = await dm.getDebater(debaterName);

            // Uncommit the debater
            const newState = await dm.uncommitDebater(debaterName);
            
            // Record in history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.UNCOMMIT_DEBATER,
                {
                    debaterName,
                    oldState,
                    newState
                }
            );

            await interaction.editReply(`Uncommitted ${debaterName} (Command ID: ${historyEntry.commandId})`);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to uncommit debater: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
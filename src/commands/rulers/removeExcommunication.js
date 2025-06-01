const { SlashCommandBuilder } = require('discord.js');
const rulerManager = require('../../game/rulerManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove_excommunication')
        .setDescription('Remove excommunication from a ruler')
        .addStringOption(option =>
            option.setName('ruler')
                .setDescription('Name of the ruler')
                .setRequired(true)),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const rulerName = interaction.options.getString('ruler');
        
        try {
            // Remove excommunication and update card modifiers
            const result = await rulerManager.removeExcommunication(rulerName);
            
            // Record in history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.REMOVE_EXCOMMUNICATION,
                {
                    ruler: result.ruler
                }
            );

            let response = `Excommunication removed from ${rulerName}`;
            if (result.cardModifierChange) {
                response += `\nCard modifier for ${result.ruler.faction}: +${result.cardModifierChange} (now ${result.newCardModifier})`;
            }
            response += ` (Command ID: ${historyEntry.commandId})`;

            await interaction.editReply(response);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to remove excommunication: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
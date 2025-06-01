const { SlashCommandBuilder } = require('discord.js');
const rulerManager = require('../../game/rulerManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('excommunicate')
        .setDescription('Excommunicate a ruler')
        .addStringOption(option =>
            option.setName('ruler')
                .setDescription('Name of the ruler to excommunicate')
                .setRequired(true)),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const rulerName = interaction.options.getString('ruler');
        
        try {
            // First check if ruler can be excommunicated
            const validation = await rulerManager.canBeExcommunicated(rulerName);
            if (!validation.valid) {
                throw new Error(validation.reason);
            }

            // Proceed with excommunication
            const result = await rulerManager.excommunicate(rulerName);
            
            // Record in history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.EXCOMMUNICATION,
                {
                    ruler: result.ruler,
                    reason: validation.reason
                }
            );

            let response = `${rulerName} has been excommunicated`;
            response += `\nReason: ${validation.reason}`;
            if (result.cardModifierChange) {
                response += `\nCard modifier for ${result.ruler.faction}: ${result.cardModifierChange} (now ${result.newCardModifier})`;
            }
            response += ` (Command ID: ${historyEntry.commandId})`;

            await interaction.editReply(response);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to excommunicate ruler: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
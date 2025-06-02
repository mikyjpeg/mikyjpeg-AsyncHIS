const { SlashCommandBuilder } = require('discord.js');
const rulerManager = require('../../game/rulerManager');
const reformerManager = require('../../game/reformerManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('excommunicate')
        .setDescription('Excommunicate a ruler or reformer')
        .addStringOption(option =>
            option.setName('target')
                .setDescription('Name of the ruler or reformer to excommunicate')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Whether the target is a ruler or reformer')
                .setRequired(true)
                .addChoices(
                    { name: 'Ruler', value: 'ruler' },
                    { name: 'Reformer', value: 'reformer' }
                )),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const targetName = interaction.options.getString('target');
        const targetType = interaction.options.getString('type');
        
        try {
            let result;
            let historyData;

            if (targetType === 'ruler') {
                // First check if ruler can be excommunicated
                const validation = await rulerManager.canBeExcommunicated(targetName);
                if (!validation.valid) {
                    throw new Error(validation.reason);
                }

                // Proceed with ruler excommunication
                result = await rulerManager.excommunicate(targetName);
                historyData = {
                    ruler: result.ruler,
                    reason: validation.reason
                };
            } else {
                // Handle reformer excommunication
                result = await reformerManager.excommunicate(targetName);
                historyData = {
                    reformer: result
                };
            }
            
            // Record in history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.EXCOMMUNICATION,
                historyData
            );

            let response = `${targetName} has been excommunicated`;
            if (targetType === 'ruler') {
                response += `\nReason: ${historyData.reason}`;
                if (result.cardModifierChange) {
                    response += `\nCard modifier for ${result.ruler.faction}: ${result.cardModifierChange} (now ${result.newCardModifier})`;
                }
            }
            response += ` (Command ID: ${historyEntry.commandId})`;

            await interaction.editReply(response);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to excommunicate ${targetType}: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
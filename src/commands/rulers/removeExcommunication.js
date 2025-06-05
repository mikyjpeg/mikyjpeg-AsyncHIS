const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const rulerManager = require('../../game/rulerManager');
const reformerManager = require('../../game/reformerManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove_excommunication')
        .setDescription('Remove excommunication from a ruler or reformer')
        .addStringOption(option =>
            option.setName('target')
                .setDescription('Name of the ruler or reformer')
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
                // Get the ruler
                const ruler = await rulerManager(interaction.channelId).getRuler(targetName);
                
                if (!ruler) {
                    throw new Error(`Ruler ${targetName} not found`);
                }

                if (!ruler.isExcommunicated) {
                    throw new Error(`${targetName} is not excommunicated`);
                }

                // Store old state
                const oldState = { ...ruler };

                // Update ruler
                ruler.isExcommunicated = false;
                await rulerManager(interaction.channelId).updateRuler(targetName, ruler);

                // Record in command history
                const historyEntry = await commandHistory(interaction.channelId).recordSlashCommand(
                    interaction,
                    COMMAND_TYPES.REMOVE_EXCOMMUNICATION,
                    {
                        rulerName: targetName,
                        oldState,
                        newState: ruler
                    }
                );

                result = ruler;
                historyData = {
                    ruler: result
                };
            } else {
                // Remove excommunication from reformer
                result = await reformerManager.removeExcommunication(targetName);
                historyData = {
                    reformer: result
                };
            }
            
            // Record in history
            const historyEntry = await commandHistory(interaction.channelId).recordSlashCommand(
                interaction,
                COMMAND_TYPES.REMOVE_EXCOMMUNICATION,
                historyData
            );

            let response = `Excommunication removed from ${targetName}`;
            if (targetType === 'ruler' && result.cardModifierChange) {
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
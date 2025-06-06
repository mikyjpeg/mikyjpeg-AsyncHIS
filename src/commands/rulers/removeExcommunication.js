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
        const channelName = interaction.channel.name;
        
        try {
            let result;
            let historyData;

            if (targetType === 'ruler') {
                // Get the ruler manager for this game
                const rm = rulerManager(channelName);
                
                // Get the ruler
                const ruler = await rm.getRuler(targetName);
                
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
                await rm.updateRuler(targetName, ruler);

                result = ruler;
                historyData = {
                    rulerName: targetName,
                    oldState,
                    newState: ruler
                };
            } else {
                // Get the reformer manager for this game
                const refm = reformerManager(channelName);

                // Get current state
                const oldState = await refm.getReformer(targetName);
                
                // Remove excommunication from reformer
                result = await refm.removeExcommunication(targetName);
                
                historyData = {
                    reformerName: targetName,
                    oldState,
                    newState: result
                };
            }
            
            // Record in history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
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
const { SlashCommandBuilder } = require('discord.js');
const { POWERS } = require('../../game/gameState');
const rulerManager = require('../../game/rulerManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('new_ruler')
        .setDescription('Change the ruler of a power')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power getting a new ruler')
                .setRequired(true)
                .addChoices(...Object.values(POWERS).map(power => ({
                    name: power,
                    value: power
                }))))
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name of the new ruler (optional)')
                .setRequired(false)),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const power = interaction.options.getString('power');
        const successorName = interaction.options.getString('name');
        
        try {
            // Get current ruler
            const currentRuler = await rulerManager.getCurrentRuler(power);
            if (!currentRuler) {
                await interaction.editReply(`No current ruler found for ${power}`);
                return;
            }

            // Get or generate successor
            const successor = successorName ? 
                await rulerManager.createRuler(power, successorName) :
                await rulerManager.getNextInLine(power);

            if (!successor) {
                await interaction.editReply(`Failed to find or create successor for ${power}`);
                return;
            }

            // Update rulers
            currentRuler.isCurrentRuler = false;
            successor.isCurrentRuler = true;

            await rulerManager.updateRuler(currentRuler.name, currentRuler);
            await rulerManager.updateRuler(successor.name, successor);
            
            // Record in history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.RULER_CHANGE,
                {
                    power,
                    oldRuler: currentRuler,
                    newRuler: successor
                }
            );

            await interaction.editReply(
                `${power}'s ruler changed from ${currentRuler.name} to ${successor.name} ` +
                `(Command ID: ${historyEntry.commandId})`
            );
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to change ruler: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
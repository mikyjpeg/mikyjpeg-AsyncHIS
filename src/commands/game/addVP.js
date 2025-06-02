const { SlashCommandBuilder } = require('discord.js');
const { POWERS } = require('../../game/gameState');
const victoryPointsManager = require('../../game/victoryPointsManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add_vp')
        .setDescription('Add victory points to a power')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power to add points to')
                .setRequired(true)
                .addChoices(...Object.values(POWERS).map(power => ({
                    name: power,
                    value: power
                }))))
        .addIntegerOption(option =>
            option.setName('points')
                .setDescription('Number of points to add')
                .setRequired(true)
                .setMinValue(1)),

    async execute(interaction) {
        await interaction.deferReply();

        const power = interaction.options.getString('power');
        const points = interaction.options.getInteger('points');

        try {
            // Add victory points
            await victoryPointsManager.addVictoryPoints(power, points);

            // Get updated total
            const newTotal = await victoryPointsManager.getVictoryPoints(power);

            // Record in history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.ADD_VP,
                {
                    power,
                    pointsAdded: points,
                    newTotal
                }
            );

            await interaction.editReply(
                `Added ${points} victory points to ${power}. New total: ${newTotal} (Command ID: ${historyEntry.commandId})`
            );
        } catch (error) {
            await interaction.editReply({
                content: `Failed to add victory points: ${error.message}`,
                ephemeral: true
            });
        }
    }
}; 
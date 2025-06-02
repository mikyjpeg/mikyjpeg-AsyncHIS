const { SlashCommandBuilder } = require('discord.js');
const { POWERS } = require('../../game/gameState');
const victoryPointsManager = require('../../game/victoryPointsManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove_vp')
        .setDescription('Remove victory points from a power')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power to remove points from')
                .setRequired(true)
                .addChoices(...Object.values(POWERS).map(power => ({
                    name: power,
                    value: power
                }))))
        .addIntegerOption(option =>
            option.setName('points')
                .setDescription('Number of points to remove')
                .setRequired(true)
                .setMinValue(1)),

    async execute(interaction) {
        await interaction.deferReply();

        const power = interaction.options.getString('power');
        const points = interaction.options.getInteger('points');

        try {
            // Get current points to validate removal
            const currentPoints = await victoryPointsManager.getVictoryPoints(power);
            if (points > currentPoints) {
                throw new Error(`Cannot remove ${points} points. ${power} only has ${currentPoints} points.`);
            }

            // Remove victory points
            await victoryPointsManager.removeVictoryPoints(power, points);

            // Get updated total
            const newTotal = await victoryPointsManager.getVictoryPoints(power);

            // Record in history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.REMOVE_VP,
                {
                    power,
                    pointsRemoved: points,
                    newTotal
                }
            );

            await interaction.editReply(
                `Removed ${points} victory points from ${power}. New total: ${newTotal} (Command ID: ${historyEntry.commandId})`
            );
        } catch (error) {
            await interaction.editReply({
                content: `Failed to remove victory points: ${error.message}`,
                ephemeral: true
            });
        }
    }
}; 
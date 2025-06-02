const { SlashCommandBuilder } = require('discord.js');
const { POWERS } = require('../../game/gameState');
const victoryPointsManager = require('../../game/victoryPointsManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set_vp')
        .setDescription('Set victory points for a power')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power to set points for')
                .setRequired(true)
                .addChoices(...Object.values(POWERS).map(power => ({
                    name: power,
                    value: power
                }))))
        .addIntegerOption(option =>
            option.setName('points')
                .setDescription('Number of points to set')
                .setRequired(true)
                .setMinValue(0)),

    async execute(interaction) {
        await interaction.deferReply();

        const power = interaction.options.getString('power');
        const points = interaction.options.getInteger('points');

        try {
            // Get current points for history
            const oldTotal = await victoryPointsManager.getVictoryPoints(power);

            // Set victory points
            await victoryPointsManager.setVictoryPoints(power, points);

            // Record in history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.SET_VP,
                {
                    power,
                    oldTotal,
                    newTotal: points
                }
            );

            await interaction.editReply(
                `Set ${power}'s victory points to ${points} (was ${oldTotal}) (Command ID: ${historyEntry.commandId})`
            );
        } catch (error) {
            await interaction.editReply({
                content: `Failed to set victory points: ${error.message}`,
                ephemeral: true
            });
        }
    }
}; 
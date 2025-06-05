const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const factionManager = require('../../game/factionManager');
const { POWERS } = require('../../game/gameState');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove_vp')
        .setDescription('Remove victory points from a power')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power to remove VP from')
                .setRequired(true)
                .addChoices(...Object.values(POWERS).map(power => ({ name: power, value: power }))))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount of VP to remove')
                .setRequired(true)
                .setMinValue(1)),

    async execute(interaction) {
        await interaction.deferReply();

        const power = interaction.options.getString('power');
        const amount = interaction.options.getInteger('amount');

        try {
            // Get the faction
            const faction = await factionManager(interaction.channelId).getFaction(power);
            
            if (!faction) {
                throw new Error(`Power ${power} not found`);
            }

            // Store old state
            const oldState = { ...faction };
            const oldVP = faction.victoryPoints || 0;

            // Update VP
            faction.victoryPoints = Math.max(0, oldVP - amount);
            await factionManager(interaction.channelId).updateFaction(power, faction);

            // Record in command history
            const historyEntry = await commandHistory(interaction.channelId).recordSlashCommand(
                interaction,
                COMMAND_TYPES.REMOVE_VP,
                {
                    power,
                    amount,
                    oldState,
                    newState: faction
                }
            );

            await interaction.editReply(
                `Removed ${amount} VP from ${power}. New total: ${faction.victoryPoints} VP (Command ID: ${historyEntry.commandId})`
            );
        } catch (error) {
            await interaction.editReply(`Failed to remove VP: ${error.message}`);
        }
    }
}; 
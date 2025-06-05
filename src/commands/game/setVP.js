const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const factionManager = require('../../game/factionManager');
const { POWERS } = require('../../game/gameState');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set_vp')
        .setDescription('Set victory points for a power')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power to set VP for')
                .setRequired(true)
                .addChoices(...Object.values(POWERS).map(power => ({ name: power, value: power }))))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount of VP to set')
                .setRequired(true)
                .setMinValue(0)),

    async execute(interaction) {
        await interaction.deferReply();

        const power = interaction.options.getString('power');
        const amount = interaction.options.getInteger('amount');

        try {
            // Get the channel name
            const channelName = interaction.channel.name;

            // Get faction data
            const faction = await factionManager(channelName).getFaction(power);
            
            if (!faction) {
                throw new Error(`Power ${power} not found`);
            }

            // Store old state
            const oldState = { ...faction };

            // Update VP
            faction.victoryPoints = amount;
            await factionManager(channelName).updateFaction(power, faction);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.SET_VP,
                {
                    power,
                    amount,
                    oldState,
                    newState: faction
                }
            );

            await interaction.editReply(
                `Set ${power}'s VP to ${amount} (Command ID: ${historyEntry.commandId})`
            );
        } catch (error) {
            await interaction.editReply(`Failed to set VP: ${error.message}`);
        }
    }
}; 
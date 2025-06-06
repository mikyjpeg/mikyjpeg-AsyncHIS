const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const factionManager = require('../../game/factionManager');
const { POWERS } = require('../../game/gameState');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add_vp')
        .setDescription('Add victory points to a power')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power to add VP to')
                .setRequired(true)
                .addChoices(...Object.values(POWERS).map(power => ({ name: power, value: power }))))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount of VP to add')
                .setRequired(true)
                .setMinValue(1)),

    async execute(interaction) {
        await interaction.deferReply();

        const power = interaction.options.getString('power');
        const amount = interaction.options.getInteger('amount');
        const channelName = interaction.channel.name;

        try {
            // Get faction manager for this game
            const fm = factionManager(channelName);
            
            // Get the faction
            const faction = await fm.getFaction(power);
            
            if (!faction) {
                throw new Error(`Power ${power} not found`);
            }

            // Store old state
            const oldState = { ...faction };
            const oldVP = faction.victoryPoints || 0;

            // Update VP
            faction.victoryPoints = oldVP + amount;
            await fm.updateFaction(power, faction);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.ADD_VP,
                {
                    power,
                    amount,
                    oldState,
                    newState: faction
                }
            );

            await interaction.editReply(
                `Added ${amount} VP to ${power}. New total: ${faction.victoryPoints} VP (Command ID: ${historyEntry.commandId})`
            );
        } catch (error) {
            await interaction.editReply(`Failed to add VP: ${error.message}`);
        }
    }
}; 
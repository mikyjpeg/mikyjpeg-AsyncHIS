const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const actionsManager = require('../../game/actionsManager');
const factionManager = require('../../game/factionManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('build_saint_peters')
        .setDescription('Build Saint Peter\'s Basilica (Papacy action)')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power performing the action')
                .setRequired(true)
                .addChoices(
                    { name: 'Papacy', value: 'Papacy' }
                ))
        .addIntegerOption(option =>
            option.setName('cp_spent')
                .setDescription('Number of CP to spend on construction')
                .setRequired(true)
                .setMinValue(1)),

    async execute(interaction) {
        try {
            const power = interaction.options.getString('power');
            const cpSpent = interaction.options.getInteger('cp_spent');
            const channelName = interaction.channel.name;

            // Get actions manager for this game
            const am = actionsManager(channelName);

            // Validate the action exists and can be performed by this power
            await am.validateAction('build_saint_peter_s', power);

            // Get the action cost
            const cost = await am.getActionCost('build_saint_peter_s', power);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.ACTION,
                {
                    actionId: 'build_saint_peter_s',
                    power,
                    cpSpent,
                    cost
                }
            );

            // For now, just acknowledge the command
            await interaction.reply({
                content: `Action: Build Saint Peter's Basilica\nPower: ${power}\nCP Spent: ${cpSpent} (Cost: ${cost})\n(Command ID: ${historyEntry.commandId})`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in build_saint_peters command:', error);
            await interaction.reply({
                content: error.message || 'There was an error executing the action!',
                ephemeral: true
            });
        }
    }
}; 
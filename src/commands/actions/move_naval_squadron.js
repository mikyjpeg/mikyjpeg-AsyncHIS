const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const actionsManager = require('../../game/actionsManager');
const factionManager = require('../../game/factionManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('move_naval_squadron')
        .setDescription('Move all naval units to adjacent port/sea zone. Triggers naval combat if enemies present.')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power performing the action')
                .setRequired(true)
                .addChoices(
                    { name: 'Ottoman', value: 'Ottoman' },
                    { name: 'Hapsburg', value: 'Hapsburg' },
                    { name: 'England', value: 'England' },
                    { name: 'France', value: 'France' },
                    { name: 'Papacy', value: 'Papacy' },
                    { name: 'Protestant', value: 'Protestant' }))
        .addStringOption(option =>
            option.setName('from_space')
                .setDescription('Starting space of the movement')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('to_space')
                .setDescription('Destination space of the movement')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const power = interaction.options.getString('power');
            const fromSpace = interaction.options.getString('from_space');
            const toSpace = interaction.options.getString('to_space');
            const channelName = interaction.channel.name;

            // Get actions manager for this game
            const am = actionsManager(channelName);

            // Validate the action exists and can be performed by this power
            await am.validateAction('move_naval_squadron', power);

            // Get the action cost
            const cost = await am.getActionCost('move_naval_squadron', power);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.ACTION_MOVE_NAVAL_SQUADRON,
                {
                    actionId: 'move_naval_squadron',
                    power,
                    fromSpace,
                    toSpace,
                    cost
                }
            );

            // For now, just acknowledge the command
            await interaction.reply({
                content: `Action: move_naval_squadron\nPower: ${power}\nFrom: ${fromSpace}\nTo: ${toSpace}\n(Cost: ${cost})\n(Command ID: ${historyEntry.commandId})`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in move_naval_squadron command:', error);
            await interaction.reply({
                content: error.message || 'There was an error executing the action!',
                ephemeral: true
            });
        }
    }
}; 
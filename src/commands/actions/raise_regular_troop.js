const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const actionsManager = require('../../game/actionsManager');
const factionManager = require('../../game/factionManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('raise_regular_troop')
        .setDescription('Raise 1 regular in any home space (friendly-controlled and not enemy occupied).')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power performing the action')
                .setRequired(true)
                .addChoices(                    { name: 'Ottoman', value: 'Ottoman' },
                    { name: 'Hapsburg', value: 'Hapsburg' },
                    { name: 'England', value: 'England' },
                    { name: 'France', value: 'France' },
                    { name: 'Papacy', value: 'Papacy' }))
        
        .addIntegerOption(option =>
            option.setName('cp_spent')
                .setDescription('Number of CP to spend')
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
            await am.validateAction('raise_regular_troop', power);

            // Get the action cost
            const cost = await am.getActionCost('raise_regular_troop', power);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.ACTION_RAISE_REGULAR_TROOP,
                {
                    actionId: 'raise_regular_troop',
                    power,
                    
                    cpSpent,
                    cost
                }
            );

            // For now, just acknowledge the command
            await interaction.reply({
                content: `Action: raise_regular_troop\nPower: ${power}\n\nCP Spent: ${cpSpent}\n(Cost: ${cost})\n(Command ID: ${historyEntry.commandId})`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in raise_regular_troop command:', error);
            await interaction.reply({
                content: error.message || 'There was an error executing the action!',
                ephemeral: true
            });
        }
    }
};
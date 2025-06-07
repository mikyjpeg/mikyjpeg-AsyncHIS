const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const actionsManager = require('../../game/actionsManager');
const factionManager = require('../../game/factionManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('move_formation_in_clear')
        .setDescription('Cost is per space entered. 4 units allowed in formation (Exception: with leaders, limit is sum of command values of 1 or 2 leaders). If enemy space is entered, field battle initiated at no additional cost. If enter enemy fortified space with 4 or fewer defending troops, defenders can withdraw into fortifications and be placed under siege.')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power performing the action')
                .setRequired(true)
                .addChoices(                    { name: 'Ottoman', value: 'Ottoman' },
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
                .setRequired(true))
        .addStringOption(option =>
            option.setName('formation_id')
                .setDescription('ID of the formation to move')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const power = interaction.options.getString('power');
            
            const fromSpace = interaction.options.getString('from_space');
            const toSpace = interaction.options.getString('to_space');
            const formationId = interaction.options.getString('formation_id');
            const channelName = interaction.channel.name;

            // Get actions manager for this game
            const am = actionsManager(channelName);

            // Validate the action exists and can be performed by this power
            await am.validateAction('move_formation_in_clear', power);

            // Get the action cost
            const cost = await am.getActionCost('move_formation_in_clear', power);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.ACTION_MOVE_FORMATION_IN_CLEAR,
                {
                    actionId: 'move_formation_in_clear',
                    power,
                    
                    fromSpace,
                    toSpace,
                    formationId,
                    cost
                }
            );

            // For now, just acknowledge the command
            await interaction.reply({
                content: `Action: move_formation_in_clear\nPower: ${power}\n\nFrom: ${fromSpace}\nTo: ${toSpace}\nFormation: ${formationId}\n(Cost: ${cost})\n(Command ID: ${historyEntry.commandId})`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in move_formation_in_clear command:', error);
            await interaction.reply({
                content: error.message || 'There was an error executing the action!',
                ephemeral: true
            });
        }
    }
};
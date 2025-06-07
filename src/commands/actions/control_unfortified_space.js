const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const actionsManager = require('../../game/actionsManager');
const factionManager = require('../../game/factionManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('control_unfortified_space')
        .setDescription('Take control of unfortified space with units in/adjacent to it. Also removes unrest.')
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
        ,

    async execute(interaction) {
        try {
            const power = interaction.options.getString('power');
            
            const channelName = interaction.channel.name;

            // Get actions manager for this game
            const am = actionsManager(channelName);

            // Validate the action exists and can be performed by this power
            await am.validateAction('control_unfortified_space', power);

            // Get the action cost
            const cost = await am.getActionCost('control_unfortified_space', power);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.ACTION_CONTROL_UNFORTIFIED_SPACE,
                {
                    actionId: 'control_unfortified_space',
                    power,
                    
                    cost
                }
            );

            // For now, just acknowledge the command
            await interaction.reply({
                content: `Action: control_unfortified_space\nPower: ${power}\n(Cost: ${cost})\n(Command ID: ${historyEntry.commandId})`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in control_unfortified_space command:', error);
            await interaction.reply({
                content: error.message || 'There was an error executing the action!',
                ephemeral: true
            });
        }
    }
};
const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const actionsManager = require('../../game/actionsManager');
const factionManager = require('../../game/factionManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('conquer')
        .setDescription('Start conquest in the New World. Resolves at end of turn.')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power performing the action')
                .setRequired(true)
                .addChoices(                    { name: 'Ottoman', value: 'Ottoman' },
                    { name: 'Hapsburg', value: 'Hapsburg' },
                    { name: 'England', value: 'England' }))
        ,

    async execute(interaction) {
        try {
            const power = interaction.options.getString('power');
            
            const channelName = interaction.channel.name;

            // Get actions manager for this game
            const am = actionsManager(channelName);

            // Validate the action exists and can be performed by this power
            await am.validateAction('conquer', power);

            // Get the action cost
            const cost = await am.getActionCost('conquer', power);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.ACTION_CONQUER,
                {
                    actionId: 'conquer',
                    power,
                    
                    cost
                }
            );

            // For now, just acknowledge the command
            await interaction.reply({
                content: `Action: conquer\nPower: ${power}\n(Cost: ${cost})\n(Command ID: ${historyEntry.commandId})`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in conquer command:', error);
            await interaction.reply({
                content: error.message || 'There was an error executing the action!',
                ephemeral: true
            });
        }
    }
};
const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const actionsManager = require('../../game/actionsManager');
const factionManager = require('../../game/factionManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('explore')
        .setDescription('Start exploration in the New World. Resolves at end of turn.')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power performing the action')
                .setRequired(true)
                .addChoices(                    { name: 'Hapsburg', value: 'Hapsburg' },
                    { name: 'England', value: 'England' },
                    { name: 'France', value: 'France' }))
        ,

    async execute(interaction) {
        try {
            const power = interaction.options.getString('power');
            
            const channelName = interaction.channel.name;

            // Get actions manager for this game
            const am = actionsManager(channelName);

            // Validate the action exists and can be performed by this power
            await am.validateAction('explore', power);

            // Get the action cost
            const cost = await am.getActionCost('explore', power);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.ACTION_EXPLORE,
                {
                    actionId: 'explore',
                    power,
                    
                    cost
                }
            );

            // For now, just acknowledge the command
            await interaction.reply({
                content: `Action: explore\nPower: ${power}\n(Cost: ${cost})\n(Command ID: ${historyEntry.commandId})`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in explore command:', error);
            await interaction.reply({
                content: error.message || 'There was an error executing the action!',
                ephemeral: true
            });
        }
    }
};
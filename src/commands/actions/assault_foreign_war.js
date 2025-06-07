const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const actionsManager = require('../../game/actionsManager');
const factionManager = require('../../game/factionManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('assault_foreign_war')
        .setDescription('Assault a besieged fortress, or resolve Ottoman/English Foreign War.')
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
            await am.validateAction('assault_foreign_war', power);

            // Get the action cost
            const cost = await am.getActionCost('assault_foreign_war', power);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.ACTION_ASSAULT_FOREIGN_WAR,
                {
                    actionId: 'assault_foreign_war',
                    power,
                    
                    cost
                }
            );

            // For now, just acknowledge the command
            await interaction.reply({
                content: `Action: assault_foreign_war\nPower: ${power}\n(Cost: ${cost})\n(Command ID: ${historyEntry.commandId})`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in assault_foreign_war command:', error);
            await interaction.reply({
                content: error.message || 'There was an error executing the action!',
                ephemeral: true
            });
        }
    }
};
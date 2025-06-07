const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const actionsManager = require('../../game/actionsManager');
const factionManager = require('../../game/factionManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('translate_scripture')
        .setDescription('Advance Bible translation. When complete, make 6 Reformation attempts in that language zone.')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power performing the action')
                .setRequired(true)
                .addChoices(                    { name: 'Protestant', value: 'Protestant' }))
        ,

    async execute(interaction) {
        try {
            const power = interaction.options.getString('power');
            
            const channelName = interaction.channel.name;

            // Get actions manager for this game
            const am = actionsManager(channelName);

            // Validate the action exists and can be performed by this power
            await am.validateAction('translate_scripture', power);

            // Get the action cost
            const cost = await am.getActionCost('translate_scripture', power);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.ACTION_TRANSLATE_SCRIPTURE,
                {
                    actionId: 'translate_scripture',
                    power,
                    
                    cost
                }
            );

            // For now, just acknowledge the command
            await interaction.reply({
                content: `Action: translate_scripture\nPower: ${power}\n(Cost: ${cost})\n(Command ID: ${historyEntry.commandId})`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in translate_scripture command:', error);
            await interaction.reply({
                content: error.message || 'There was an error executing the action!',
                ephemeral: true
            });
        }
    }
};
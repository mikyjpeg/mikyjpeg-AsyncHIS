const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const actionsManager = require('../../game/actionsManager');
const factionManager = require('../../game/factionManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('publish_treatise')
        .setDescription('Protestant: 2 Reformation attempts targeting one language zone (2 CP). England: 2 Reformation attempts in English language zone (3 CP).')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power performing the action')
                .setRequired(true)
                .addChoices(                    { name: 'England', value: 'England' },
                    { name: 'Protestant', value: 'Protestant' }))
        
        .addStringOption(option =>
            option.setName('language_zone')
                .setDescription('Language zone to publish in')
                .setRequired(true)
                .addChoices(
                    { name: 'English', value: 'english' },
                    { name: 'German', value: 'german' },
                    { name: 'French', value: 'french' }
                )),

    async execute(interaction) {
        try {
            const power = interaction.options.getString('power');
            
            const languageZone = interaction.options.getString('language_zone');
            const channelName = interaction.channel.name;

            // Get actions manager for this game
            const am = actionsManager(channelName);

            // Validate the action exists and can be performed by this power
            await am.validateAction('publish_treatise', power);

            // Get the action cost
            const cost = await am.getActionCost('publish_treatise', power);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.ACTION_PUBLISH_TREATISE,
                {
                    actionId: 'publish_treatise',
                    power,
                    
                    languageZone,
                    cost
                }
            );

            // For now, just acknowledge the command
            await interaction.reply({
                content: `Action: publish_treatise\nPower: ${power}\n\nLanguage Zone: ${languageZone}\n(Cost: ${cost})\n(Command ID: ${historyEntry.commandId})`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in publish_treatise command:', error);
            await interaction.reply({
                content: error.message || 'There was an error executing the action!',
                ephemeral: true
            });
        }
    }
};
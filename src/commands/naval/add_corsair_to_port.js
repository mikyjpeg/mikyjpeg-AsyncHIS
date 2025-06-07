const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const navalManager = require('../../game/navalManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add_corsair_to_port')
        .setDescription('Add corsair(s) to a port space')
        .addStringOption(option =>
            option.setName('space')
                .setDescription('Port space to add the corsair to')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('number')
                .setDescription('Number of corsairs to add')
                .setRequired(true)
                .setMinValue(1)),

    async execute(interaction) {
        try {
            const spaceName = interaction.options.getString('space');
            const number = interaction.options.getInteger('number');
            const channelName = interaction.channel.name;

            // Create corsair object
            const squadron = {
                power: 'Ottoman',
                corsair: number,
                loans: []
            };

            // Add corsair to port
            const nm = navalManager(channelName);
            const updatedSpace = await nm.addSquadronToPort(spaceName, squadron);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.ADD_CORSAIR_TO_PORT,
                {
                    spaceName,
                    squadron
                }
            );

            // Format response message
            const message = `Added ${number} corsair(s) to ${spaceName} (Command ID: ${historyEntry.commandId})`;

            await interaction.reply(message);

        } catch (error) {
            await interaction.reply({ 
                content: `Failed to add corsair: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
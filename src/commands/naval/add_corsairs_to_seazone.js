const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const navalManager = require('../../game/navalManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add_corsairs_to_seazone')
        .setDescription('Add corsair(s) to a sea zone')
        .addStringOption(option =>
            option.setName('seazone')
                .setDescription('Sea zone to add the corsair to')
                .setRequired(true)
                .addChoices(
                    { name: 'Adriatic Sea', value: 'adriatic_sea' },
                    { name: 'Aegean Sea', value: 'aegean_sea' },
                    { name: 'Atlantic Ocean', value: 'atlantic_ocean' },
                    { name: 'Baltic Sea', value: 'baltic_sea' },
                    { name: 'Barbary Coast', value: 'barbary_coast' },
                    { name: 'Bay of Biscay', value: 'bay_of_biscay' },
                    { name: 'Black Sea', value: 'black_sea' },
                    { name: 'English Channel', value: 'english_channel' },
                    { name: 'Gulf of Lyon', value: 'gulf_of_lyon' },
                    { name: 'Ionian Sea', value: 'ionian_sea' },
                    { name: 'Irish Sea', value: 'irish_sea' },
                    { name: 'North African Coast', value: 'north_african_coast' },
                    { name: 'North Sea', value: 'north_sea' },
                    { name: 'Tyrrhenian Sea', value: 'tyrrhenian_sea' }
                ))
        .addIntegerOption(option =>
            option.setName('number')
                .setDescription('Number of corsairs to add')
                .setRequired(true)
                .setMinValue(1)),

    async execute(interaction) {
        try {
            const seaZoneName = interaction.options.getString('seazone');
            const number = interaction.options.getInteger('number');
            const channelName = interaction.channel.name;

            // Create corsair object
            const squadron = {
                power: 'Ottoman',
                corsair: number,
                loans: []
            };

            // Add corsair to sea zone
            const nm = navalManager(channelName);
            await nm.addSquadronToSeaZone(seaZoneName, squadron);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.ADD_CORSAIRS_TO_SEAZONE,
                {
                    seaZoneName,
                    squadron
                }
            );

            // Format response message
            const message = `Added ${number} corsair(s) to ${seaZoneName} (Command ID: ${historyEntry.commandId})`;

            await interaction.reply(message);

        } catch (error) {
            await interaction.reply({ 
                content: `Failed to add corsair: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
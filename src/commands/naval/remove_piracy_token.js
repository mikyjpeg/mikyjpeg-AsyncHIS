const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const navalManager = require('../../game/navalManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove_piracy_token')
        .setDescription('Remove piracy token from a sea zone (Ottoman only)')
        .addStringOption(option =>
            option.setName('seazone')
                .setDescription('Sea zone to remove piracy token from')
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
                )),

    async execute(interaction) {
        try {
            const seaZoneName = interaction.options.getString('seazone');
            const channelName = interaction.channel.name;

            // Get sea zone
            const nm = navalManager(channelName);
            const seaZone = await nm.getSeaZone(seaZoneName);

            // Check if there is a piracy token
            if (!seaZone.hasPiracyToken) {
                throw new Error('No piracy token found in this sea zone');
            }

            // Remove piracy token
            await nm.setPiracyToken(seaZoneName, false);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.SET_PIRACY_TOKEN,
                {
                    seaZoneName,
                    power: 'Ottoman',
                    removed: true
                }
            );

            // Format response message
            const message = `Removed piracy token from ${seaZoneName} (Command ID: ${historyEntry.commandId})`;

            await interaction.reply(message);

        } catch (error) {
            await interaction.reply({ 
                content: `Failed to remove piracy token: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
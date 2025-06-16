const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const navalManager = require('../../game/navalManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set_piracy_token')
        .setDescription('Set piracy token in a sea zone (Ottoman only)')
        .addStringOption(option =>
            option.setName('seazone')
                .setDescription('Sea zone to set piracy token in')
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

            // Check if there are Ottoman corsairs in the sea zone
            const ottomanSquadron = seaZone.squadrons?.find(s => s.power === 'Ottoman');
            if (!ottomanSquadron || !ottomanSquadron.corsair) {
                throw new Error('Ottoman must have corsairs in the sea zone to set a piracy token');
            }

            // Set piracy token
            await nm.setPiracyToken(seaZoneName, true);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.SET_PIRACY_TOKEN,
                {
                    seaZoneName,
                    power: 'Ottoman'
                }
            );

            // Format response message
            const message = `Set piracy token in ${seaZoneName} (Command ID: ${historyEntry.commandId})`;

            await interaction.reply(message);

        } catch (error) {
            await interaction.reply({ 
                content: `Failed to set piracy token: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
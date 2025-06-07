const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const navalManager = require('../../game/navalManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add_squadron_to_port')
        .setDescription('Add naval squadron(s) to a port space')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power that owns the squadron')
                .setRequired(true)
                .addChoices(
                    { name: 'Ottoman', value: 'Ottoman' },
                    { name: 'Hapsburg', value: 'Hapsburg' },
                    { name: 'England', value: 'England' },
                    { name: 'France', value: 'France' },
                    { name: 'Papacy', value: 'Papacy' },
                    { name: 'Venice', value: 'Venice' },
                    { name: 'Genoa', value: 'Genoa' },
                    { name: 'Scotland', value: 'Scotland' }
                ))
        .addStringOption(option =>
            option.setName('space')
                .setDescription('Port space to add the squadron to')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('number')
                .setDescription('Number of squadrons to add')
                .setRequired(true)
                .setMinValue(1))
        .addBooleanOption(option =>
            option.setName('loaned')
                .setDescription('Whether the squadron is loaned from another power')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('loaning_power')
                .setDescription('The power that loaned the squadron (required if loaned=true)')
                .setRequired(false)
                .addChoices(
                    { name: 'Ottoman', value: 'Ottoman' },
                    { name: 'Hapsburg', value: 'Hapsburg' },
                    { name: 'England', value: 'England' },
                    { name: 'France', value: 'France' },
                    { name: 'Papacy', value: 'Papacy' },
                    { name: 'Venice', value: 'Venice' },
                    { name: 'Genoa', value: 'Genoa' },
                    { name: 'Scotland', value: 'Scotland' }
                )),

    async execute(interaction) {
        try {
            const power = interaction.options.getString('power');
            const spaceName = interaction.options.getString('space');
            const number = interaction.options.getInteger('number');
            const loaned = interaction.options.getBoolean('loaned') || false;
            const loaningPower = interaction.options.getString('loaning_power');
            const channelName = interaction.channel.name;

            // Validate loaned and loaningPower combination
            if (loaned && !loaningPower) {
                throw new Error('When loaned=true, loaning_power must be specified');
            }
            if (!loaned && loaningPower) {
                throw new Error('Cannot specify loaning_power when loaned=false');
            }

            // Create squadron object
            const squadron = {
                power,
                squadron: number,
                loans: loaned ? [{ power: loaningPower, squadron: number }] : []
            };

            // Add squadron to port
            const nm = navalManager(channelName);
            const updatedSpace = await nm.addSquadronToPort(spaceName, squadron);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.ADD_SQUADRON_TO_PORT,
                {
                    power,
                    spaceName,
                    squadron
                }
            );

            // Format response message
            let message = `Added ${number} squadron(s) for ${power} to ${spaceName}`;
            if (loaned) {
                message += ` (loaned from ${loaningPower})`;
            }
            message += ` (Command ID: ${historyEntry.commandId})`;

            await interaction.reply(message);

        } catch (error) {
            await interaction.reply({ 
                content: `Failed to add squadron: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
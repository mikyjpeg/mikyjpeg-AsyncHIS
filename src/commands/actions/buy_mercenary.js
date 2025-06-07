const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const actionsManager = require('../../game/actionsManager');
const spaceManager = require('../../game/spaceManager');
const formationManager = require('../../game/formationManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buy_mercenary')
        .setDescription('Raise 1 mercenary in any home space (friendly-controlled and not enemy occupied).')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power performing the action')
                .setRequired(true)
                .addChoices(
                    { name: 'Hapsburg', value: 'Hapsburg' },
                    { name: 'England', value: 'England' },
                    { name: 'France', value: 'France' },
                    { name: 'Papacy', value: 'Papacy' },
                    { name: 'Protestant', value: 'Protestant' }))
        .addStringOption(option =>
            option.setName('space')
                .setDescription('Space to add the mercenary to')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const power = interaction.options.getString('power');
            const spaceName = interaction.options.getString('space');
            const channelName = interaction.channel.name;

            // Get managers for this game
            const am = actionsManager(channelName);
            const sm = spaceManager(channelName);
            const fm = formationManager(channelName);

            // Validate the action exists and can be performed by this power
            await am.validateAction('buy_mercenary', power);

            // Validate and spend CP
            const { cost, remainingCP } = await am.validateAndSpendCP('buy_mercenary', power);

            // Get the space and validate it's a valid target
            const space = await sm.getSpace(spaceName);
            
            // Check if space is a home space of the power and uncontrolled
            if (space.homePower !== power) {
                throw new Error(`${spaceName} is not a home space of ${power}`);
            }
            if (space.controllingPower !== null) {
                throw new Error(`${spaceName} is controlled by ${space.controllingPower}`);
            }

            // Add the mercenary (0 regulars, 1 mercenary, no leaders)
            const updatedSpace = await fm.addFormation(spaceName, power, 0, 1, []);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.ACTION_BUY_MERCENARY,
                {
                    actionId: 'buy_mercenary',
                    power,
                    spaceName,
                    cost,
                    remainingCP
                }
            );

            // Send response
            await interaction.reply({
                content: `Added 1 mercenary for ${power} in ${spaceName} (Cost: ${cost} CP, ${remainingCP} CP remaining)\n(Command ID: ${historyEntry.commandId})`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in buy_mercenary command:', error);
            await interaction.reply({
                content: error.message || 'There was an error executing the action!',
                ephemeral: true
            });
        }
    }
};
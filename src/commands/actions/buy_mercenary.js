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
                    { name: 'Protestant', value: 'Protestant' }
                ))
        .addStringOption(option =>
            option.setName('space')
                .setDescription('Space to add the mercenary to')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const power = interaction.options.getString('power');
            const spaceName = interaction.options.getString('space');
            const channelName = interaction.channel.name;

            // Get managers
            const sm = spaceManager(channelName);
            const fm = formationManager(channelName);
            const am = actionsManager(channelName);

            // Get the space
            const space = await sm.getSpace(spaceName);

            // Validate it's a home space
            if (space.homePower !== power) {
                throw new Error(`${spaceName} is not a home space for ${power}`);
            }

            // Validate it's not controlled by another power
            if (space.controllingPower && space.controllingPower !== power) {
                throw new Error(`${spaceName} is controlled by ${space.controllingPower}`);
            }

            // Check for enemy formations
            if (await fm.hasEnemyFormations(spaceName, power)) {
                throw new Error(`${spaceName} contains enemy formations`);
            }

            // Validate and spend CP
            const { cost, remainingCP } = await am.validateAndSpendCP(power);

            // Add the mercenary
            const updatedSpace = await fm.addFormation(spaceName, power, 0, 1, []);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.BUY_MERCENARY,
                {
                    power,
                    spaceName,
                    cost,
                    remainingCP
                }
            );

            await interaction.reply(
                `Added 1 mercenary to ${spaceName} for ${power}. Cost: ${cost} CP. Remaining CP: ${remainingCP}. ` +
                `(Command ID: ${historyEntry.commandId})`
            );

        } catch (error) {
            await interaction.reply({ 
                content: `Failed to buy mercenary: ${error.message}`,
                ephemeral: true 
            });
        }
    }
};
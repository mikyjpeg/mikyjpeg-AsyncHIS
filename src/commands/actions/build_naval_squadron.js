const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const actionsManager = require('../../game/actionsManager');
const navalManager = require('../../game/navalManager');
const cardManager = require('../../game/cardManager');
const spaceManager = require('../../game/spaceManager');
const diplomacyManager = require('../../game/diplomacyManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('build_naval_squadron')
        .setDescription('Raise 1 naval squadron in any home port (friendly-controlled and not enemy occupied).')
        .addStringOption(option =>
            option.setName('space')
                .setDescription('The space where to build the squadron')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const spaceName = interaction.options.getString('space');
            const channelName = interaction.channel.name;

            // Get managers
            const am = actionsManager(channelName);
            const nm = navalManager(channelName);
            const cm = cardManager(channelName);
            const sm = spaceManager(channelName);
            const dm = diplomacyManager(channelName);

            // Get current status to check active player
            const status = await cm.getStatus();
            if (!status.activePlayer) {
                throw new Error('No active player in the current game state');
            }

            // Validate the action exists and can be performed by this power
            await am.validateAction('build_naval_squadron', status.activePlayer);

            // Get the action cost
            const cost = await am.getActionCost('build_naval_squadron', status.activePlayer);

            // Check if there are enough CP
            if (status.currentImpulse.availableCP < cost) {
                throw new Error(`Not enough CP available. Required: ${cost}, Available: ${status.currentImpulse.availableCP}`);
            }

            // Get space and validate it
            const space = await sm.getSpace(spaceName);

            // Validate space has ports
            if (!space.hasPorts) {
                throw new Error(`${spaceName} does not have ports`);
            }

            // Validate it's a home space for the active power
            if (!space.homePower || space.homePower !== status.activePlayer) {
                throw new Error(`${spaceName} is not a home space for ${status.activePlayer}`);
            }

            // Validate space is friendly controlled
            if (space.controllingPower && space.controllingPower !== status.activePlayer) {
                // Check if the controlling power is an ally
                const activeFaction = await dm.getFaction(status.activePlayer);
                if (!activeFaction.alliances.includes(space.controllingPower)) {
                    throw new Error(`${spaceName} is controlled by ${space.controllingPower} which is not an ally of ${status.activePlayer}`);
                }
            }

            // Validate no enemy formations
            if (space.formations) {
                for (const formation of space.formations) {
                    if (formation.power !== status.activePlayer) {
                        // Check if the formation's power is an ally
                        const activeFaction = await dm.getFaction(status.activePlayer);
                        if (!activeFaction.alliances.includes(formation.power)) {
                            throw new Error(`${spaceName} contains enemy formations from ${formation.power}`);
                        }
                    }
                }
            }

            // Create squadron object
            const squadron = {
                power: status.activePlayer,
                squadron: 1,
                loans: []
            };

            // Add squadron to port
            const updatedSpace = await nm.addSquadronToPort(spaceName, squadron);

            // Deduct CP cost
            status.currentImpulse.availableCP -= cost;
            await cm.saveStatus(status);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.ACTION_BUILD_NAVAL_SQUADRON,
                {
                    actionId: 'build_naval_squadron',
                    power: status.activePlayer,
                    spaceName,
                    squadron,
                    cost
                }
            );

            // Format response message
            const message = `Added 1 naval squadron to ${spaceName} for ${status.activePlayer}. Cost: ${cost} CP. (Command ID: ${historyEntry.commandId})`;

            await interaction.reply(message);

        } catch (error) {
            console.error('Error in build_naval_squadron command:', error);
            await interaction.reply({
                content: error.message || 'There was an error executing the action!',
                ephemeral: true
            });
        }
    }
};
const { SlashCommandBuilder } = require('discord.js');
const electorateManager = require('../../game/electorateManager');
const formationManager = require('../../game/formationManager');
const spaceManager = require('../../game/spaceManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deploy_electorate')
        .setDescription('Deploy an electorate for the Protestant power')
        .addStringOption(option =>
            option.setName('electorate')
                .setDescription('Name of the electorate')
                .setRequired(true)
                .addChoices(
                    { name: 'Augsburg', value: 'Augsburg' },
                    { name: 'Brandenburg', value: 'Brandenburg' },
                    { name: 'Cologne', value: 'Cologne' },
                    { name: 'Mainz', value: 'Mainz' },
                    { name: 'Trier', value: 'Trier' },
                    { name: 'Wittenberg', value: 'Wittenberg' }
                ))
        .addBooleanOption(option =>
            option.setName('control')
                .setDescription('Whether to also take control of the space')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        const electorateName = interaction.options.getString('electorate');
        const shouldControl = interaction.options.getBoolean('control');

        try {
            // Get the electorate data and clear its regulars
            const { electorate, regulars } = await electorateManager.clearRegulars(electorateName);

            // Update control if requested
            let previousController = null;
            if (shouldControl) {
                const space = await spaceManager.getSpace(electorateName);
                previousController = space.controllingPower;
                space.controllingPower = 'Protestant';
                await spaceManager.updateSpace(electorateName, space);

                // Set controlMarker to false since it's now on the space
                electorate.controlMarker = false;
                await electorateManager.updateElectorate(electorateName, electorate);
            }

            // Add formation directly using formationManager
            if (regulars > 0) {
                await formationManager.addFormation(electorateName, 'Protestant', regulars, 0, []);
            }

            // Record in history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.DEPLOY_ELECTORATE,
                {
                    electorate,
                    regulars,
                    shouldControl,
                    previousController
                }
            );

            let reply = `Deployed ${regulars} regulars from ${electorateName} for Protestant`;
            if (shouldControl) {
                const space = await spaceManager.getSpace(electorateName);
                const displayPreviousController = previousController || space.homePower;
                reply += ` and took control from ${displayPreviousController}`;
            }
            reply += ` (Command ID: ${historyEntry.commandId})`;

            await interaction.editReply(reply);
        } catch (error) {
            console.error('Error in deploy_electorate:', error);
            await interaction.editReply({
                content: `Failed to deploy electorate: ${error.message}`,
                ephemeral: true
            });
        }
    }
}; 
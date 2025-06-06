const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const electorateManager = require('../../game/electorateManager');
const formationManager = require('../../game/formationManager');
const spaceManager = require('../../game/spaceManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deploy_electorate')
        .setDescription('Deploy an electorate')
        .addStringOption(option =>
            option.setName('electorate')
                .setDescription('The electorate to deploy')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('control')
                .setDescription('Whether to take control of the electorate')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        const electorateName = interaction.options.getString('electorate');
        const shouldControl = interaction.options.getBoolean('control');
        const channelName = interaction.channel.name;

        try {
            // Get electorate manager for this game
            const em = electorateManager(channelName);
            
            // Get the electorate
            const electorate = await em.getElectorate(electorateName);
            
            if (!electorate) {
                throw new Error(`Electorate ${electorateName} not found`);
            }

            // Store old state
            const oldState = { ...electorate };

            // Update electorate
            electorate.isDeployed = true;
            if (shouldControl) {
                electorate.isControlled = true;
            }
            await em.updateElectorate(electorateName, electorate);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.DEPLOY_ELECTORATE,
                {
                    electorateName,
                    shouldControl,
                    oldState,
                    newState: electorate
                }
            );

            const controlMsg = shouldControl ? ' and took control of it' : '';
            await interaction.editReply(
                `Deployed electorate ${electorateName}${controlMsg} (Command ID: ${historyEntry.commandId})`
            );
        } catch (error) {
            await interaction.editReply(`Failed to deploy electorate: ${error.message}`);
        }
    }
}; 
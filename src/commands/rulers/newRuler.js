const { SlashCommandBuilder } = require('discord.js');
const { POWERS } = require('../../game/gameState');
const rulerSuccessionManager = require('../../game/rulerSuccessionManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('new_ruler')
        .setDescription('Change the ruler of a power')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power getting a new ruler')
                .setRequired(true)
                .addChoices(...Object.values(POWERS).map(power => ({
                    name: power,
                    value: power
                }))))
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name of the new ruler (optional)')
                .setRequired(false)),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const power = interaction.options.getString('power');
        const successorName = interaction.options.getString('name');
        const channelName = interaction.channel.name;
        
        try {
            // Get ruler succession manager for this game
            const rsm = rulerSuccessionManager(channelName);

            // Validate the faction has defined succession rules
            if (!rsm.isValidFaction(power)) {
                await interaction.editReply(`No succession rules defined for ${power}`);
                return;
            }

            // Change ruler using succession manager
            const { oldRuler, newRuler } = await rsm.changeRuler(power, successorName);
            
            // Record in history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.RULER_CHANGE,
                {
                    power,
                    oldRuler,
                    newRuler
                }
            );

            await interaction.editReply(
                `${power}'s ruler changed from ${oldRuler.name} to ${newRuler.name} ` +
                `(Command ID: ${historyEntry.commandId})`
            );
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to change ruler: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
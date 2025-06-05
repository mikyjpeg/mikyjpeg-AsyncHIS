const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const rulerManager = require('../../game/rulerManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('excommunicate')
        .setDescription('Excommunicate a ruler')
        .addStringOption(option =>
            option.setName('ruler')
                .setDescription('The ruler to excommunicate')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        const rulerName = interaction.options.getString('ruler');

        try {
            // Get the channel name
            const channelName = interaction.channel.name;

            // Get the ruler
            const ruler = await rulerManager(channelName).getRuler(rulerName);
            
            if (!ruler) {
                throw new Error(`Ruler ${rulerName} not found`);
            }

            if (ruler.isExcommunicated) {
                throw new Error(`${rulerName} is already excommunicated`);
            }

            // Store old state
            const oldState = { ...ruler };

            // Update ruler
            ruler.isExcommunicated = true;
            await rulerManager(channelName).updateRuler(rulerName, ruler);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.EXCOMMUNICATION,
                {
                    rulerName,
                    oldState,
                    newState: ruler
                }
            );

            await interaction.editReply(
                `${rulerName} has been excommunicated! (Command ID: ${historyEntry.commandId})`
            );
        } catch (error) {
            await interaction.editReply(`Failed to excommunicate ruler: ${error.message}`);
        }
    }
}; 
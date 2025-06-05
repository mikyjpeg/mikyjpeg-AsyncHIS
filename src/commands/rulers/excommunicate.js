const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const rulerManager = require('../../game/rulerManager');
const diplomacyManager = require('../../game/diplomacyManager');

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

            // Get the managers
            const rm = rulerManager(channelName);
            const dm = diplomacyManager(channelName);

            // Check if ruler can be excommunicated
            const validation = await rm.canBeExcommunicated(rulerName);
            if (!validation.valid) {
                throw new Error(validation.reason);
            }

            // Get current states before changes
            const ruler = await rm.getRuler(rulerName);
            const faction = await dm.getFaction(ruler.faction);
            const oldState = {
                ruler: { ...ruler },
                faction: { ...faction }
            };

            // Excommunicate the ruler
            const result = await rm.excommunicate(rulerName);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.EXCOMMUNICATION,
                {
                    rulerName,
                    oldState,
                    newState: {
                        ruler: result.ruler,
                        faction: await dm.getFaction(ruler.faction)
                    },
                    reason: validation.reason
                }
            );

            await interaction.editReply(
                `${rulerName} has been excommunicated because: ${validation.reason}!\n` +
                `Card modifier for ${result.ruler.faction} changed by ${result.cardModifierChange} to ${result.newCardModifier}.\n` +
                `(Command ID: ${historyEntry.commandId})`
            );
        } catch (error) {
            await interaction.editReply(`Failed to excommunicate ruler: ${error.message}`);
        }
    }
}; 
const { SlashCommandBuilder } = require('discord.js');
const { POWERS } = require('../../game/gameState');
const diplomacyManager = require('../../game/diplomacyManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('declare_war')
        .setDescription('Declare war on another power')
        .addStringOption(option =>
            option.setName('power1')
                .setDescription('First power')
                .setRequired(true)
                .addChoices(...Object.values(POWERS).map(power => ({ name: power, value: power }))))
        .addStringOption(option =>
            option.setName('power2')
                .setDescription('Second power')
                .setRequired(true)
                .addChoices(...Object.values(POWERS).map(power => ({ name: power, value: power })))),

    async execute(interaction) {
        await interaction.deferReply();

        const power1 = interaction.options.getString('power1');
        const power2 = interaction.options.getString('power2');

        if (power1 === power2) {
            await interaction.editReply('A power cannot declare war on itself!');
            return;
        }

        try {
            // Get the channel name
            const channelName = interaction.channel.name;

            // Get the diplomacy manager for this game
            const dm = diplomacyManager(channelName);

            // Get current states before changes
            const faction1 = await dm.getFaction(power1);
            const faction2 = await dm.getFaction(power2);
            const oldState = {
                faction1: { ...faction1 },
                faction2: { ...faction2 }
            };

            // Declare war
            await dm.declareWar(power1, power2);

            // Get updated states
            const newState = {
                faction1: await dm.getFaction(power1),
                faction2: await dm.getFaction(power2)
            };

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.DECLARE_WAR,
                {
                    power1,
                    power2,
                    oldState,
                    newState
                }
            );

            await interaction.editReply(`${power1} has declared war on ${power2}! (Command ID: ${historyEntry.commandId})`);
        } catch (error) {
            await interaction.editReply(`Failed to declare war: ${error.message}`);
        }
    }
}; 
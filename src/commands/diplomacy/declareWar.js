const { SlashCommandBuilder } = require('discord.js');
const { GameState, POWERS } = require('../../game/gameState');
const diplomacyManager = require('../../game/diplomacyManager');

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
            const dm = diplomacyManager(interaction.channelId);
            await dm.declareWar(power1, power2);
            await interaction.editReply(`${power1} has declared war on ${power2}!`);
        } catch (error) {
            await interaction.editReply(`Failed to declare war: ${error.message}`);
        }
    }
}; 
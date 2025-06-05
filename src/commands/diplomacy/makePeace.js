const { SlashCommandBuilder } = require('discord.js');
const { GameState, POWERS } = require('../../game/gameState');
const diplomacyManager = require('../../game/diplomacyManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('make_peace')
        .setDescription('Make peace between two powers')
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
            await interaction.editReply('A power cannot make peace with itself!');
            return;
        }

        try {
            // Get the channel name
            const channelName = interaction.channel.name;

            // Get the diplomacy manager for this game
            const dm = diplomacyManager(channelName);

            // Get current states
            const faction1 = await dm.getFaction(power1);
            const faction2 = await dm.getFaction(power2);

            await dm.makePeace(power1, power2);
            await interaction.editReply(`${power1} and ${power2} have made peace!`);
        } catch (error) {
            await interaction.editReply(`Failed to make peace: ${error.message}`);
        }
    }
}; 
const { SlashCommandBuilder } = require('discord.js');
const { GameState, POWERS } = require('../../game/gameState');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Join the game as a power')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power to join as')
                .setRequired(true)
                .addChoices(...Object.values(POWERS).map(power => ({ name: power, value: power })))),

    async execute(interaction) {
        await interaction.deferReply();

        const power = interaction.options.getString('power');
        const userId = interaction.user.id;
        const username = interaction.user.username;

        try {
            const gameState = GameState(interaction.channelId);
            await gameState.assignPower(userId, username, power);
            await interaction.editReply(`You have joined the game as ${power}!`);
        } catch (error) {
            await interaction.editReply(`Failed to join as ${power}: ${error.message}`);
        }
    }
}; 
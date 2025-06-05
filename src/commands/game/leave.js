const { SlashCommandBuilder } = require('discord.js');
const { GameState, POWERS } = require('../../game/gameState');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Leave your current power')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power to leave')
                .setRequired(true)
                .addChoices(...Object.values(POWERS).map(power => ({ name: power, value: power })))),

    async execute(interaction) {
        await interaction.deferReply();

        const power = interaction.options.getString('power');
        const userId = interaction.user.id;

        try {
            const gameState = GameState(interaction.channelId);
            await gameState.leavePower(userId, power);
            await interaction.editReply(`You have left ${power}!`);
        } catch (error) {
            await interaction.editReply(`Failed to leave ${power}: ${error.message}`);
        }
    }
}; 
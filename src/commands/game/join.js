const { SlashCommandBuilder } = require('discord.js');
const { POWERS } = require('../../game/gameState');
const factionManager = require('../../game/factionManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

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
            // Get the channel name
            const channelName = interaction.channel.name;

            // Get the faction manager for this game
            const fm = factionManager(channelName);

            // Get the faction
            const faction = await fm.getFaction(power);
            
            // Check if power is already taken
            if (faction.isActive) {
                await interaction.editReply(`${power} is already taken by ${faction.discordUsername}!`);
                return;
            }

            // Check if user is already playing as another power
            const allFactions = await fm.getAllFactions();
            const userFaction = Object.values(allFactions).find(f => f.discordUserId === userId);
            if (userFaction) {
                await interaction.editReply(`You are already playing as ${userFaction.name}!`);
                return;
            }

            // Update faction data
            const previousFaction = { ...faction };
            faction.discordUserId = userId;
            faction.discordUsername = username;
            faction.isActive = true;
            await fm.updateFaction(power, faction);

            // Record in history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.JOIN_POWER,
                {
                    power,
                    userId,
                    username,
                    previousFaction
                }
            );

            await interaction.editReply(`You have joined the game as ${power}! (Command ID: ${historyEntry.commandId})`);
        } catch (error) {
            await interaction.editReply(`Failed to join as ${power}: ${error.message}`);
        }
    }
}; 
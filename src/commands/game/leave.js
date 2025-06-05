const { SlashCommandBuilder } = require('discord.js');
const { POWERS } = require('../../game/gameState');
const factionManager = require('../../game/factionManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

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
            // Get the channel name
            const channelName = interaction.channel.name;

            // Get the faction manager for this game
            const fm = factionManager(channelName);

            // Get the faction
            const faction = await fm.getFaction(power);
            
            // Check if user is actually controlling this power
            if (faction.discordUserId !== userId) {
                await interaction.editReply(`You are not controlling ${power}!`);
                return;
            }

            // Update faction data
            faction.discordUserId = null;
            faction.discordUsername = null;
            faction.isActive = false;
            await fm.updateFaction(power, faction);

            // Record in history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.LEAVE_POWER,
                {
                    power,
                    userId,
                    previousFaction: faction
                }
            );

            await interaction.editReply(`You have left ${power}! (Command ID: ${historyEntry.commandId})`);
        } catch (error) {
            await interaction.editReply(`Failed to leave ${power}: ${error.message}`);
        }
    }
}; 
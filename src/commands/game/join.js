const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
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
        let success = false;
        let errorMessage = null;

        try {
            // Get the channel name and ensure it's a game channel
            const channelName = interaction.channel.name;
            if (!channelName.endsWith('_his')) {
                errorMessage = 'This command can only be used in a game channel (channel name should end with _his).';
                throw new Error(errorMessage);
            }

            // Get the gameId from the channel name (first 8 characters)
            const gameId = channelName.substring(0, 8);

            // Get the faction manager for this game
            const fm = factionManager(channelName);

            // Get the faction
            const faction = await fm.getFaction(power);
            
            // Check if power is already taken
            if (faction.isActive) {
                errorMessage = `${power} is already taken by ${faction.discordUsername}!`;
                throw new Error(errorMessage);
            }

            // Check if user is already playing as another power
            const allFactions = await fm.loadAllFactions();
            const userFaction = Object.values(allFactions).find(f => f.discordUserId === userId);
            if (userFaction) {
                errorMessage = `You are already playing as ${userFaction.name}!`;
                throw new Error(errorMessage);
            }

            // Create private channel for the power
            const powerChannelName = `${gameId}_his-${power.toLowerCase()}`;
            
            // Get the position of the main channel to place power channels right after it
            const mainChannelPosition = interaction.channel.position;
            
            const powerChannel = await interaction.guild.channels.create({
                name: powerChannelName,
                type: ChannelType.GuildText,
                parent: interaction.channel.parent, // Set the same category as the main game channel
                position: mainChannelPosition + 1, // Try to position right after the main channel
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone.id,
                        deny: [PermissionFlagsBits.ViewChannel], // Hide from everyone
                    },
                    {
                        id: userId,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages], // Allow the player to view and send messages
                    },
                    {
                        id: interaction.client.user.id, // Bot's ID
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages], // Allow the bot to view and send messages
                    }
                ],
                reason: `Private channel for ${power} in game ${gameId}`
            });

            // Update faction data
            const previousFaction = { ...faction };
            faction.discordUserId = userId;
            faction.discordUsername = username;
            faction.isActive = true;
            faction.privateChannelId = powerChannel.id;
            await fm.updateFaction(power, faction);

            success = true;

            // Send welcome message in private channel
            await powerChannel.send(`Welcome to your private channel, ${username}! This is your command center as ${power}.`);

            // Record in history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.JOIN_POWER,
                {
                    power,
                    userId,
                    username,
                    previousFaction,
                    privateChannelId: powerChannel.id
                },
                success,
                errorMessage
            );

            await interaction.editReply(`You have joined the game as ${power}! Check your private channel ${powerChannel.toString()} (Command ID: ${historyEntry.commandId})`);

        } catch (error) {
            // Record the failed attempt in history
            if (interaction.channel) {
                await commandHistory(interaction.channel.name).recordSlashCommand(
                    interaction,
                    COMMAND_TYPES.JOIN_POWER,
                    {
                        power,
                        userId,
                        username
                    },
                    false,
                    error.message
                );
            }
            
            await interaction.editReply(`Failed to join as ${power}: ${error.message}`);
        }
    }
}; 
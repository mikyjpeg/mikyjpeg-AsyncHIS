const { SlashCommandBuilder, ChannelType } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create_new_game')
        .setDescription('Creates a new game with a unique ID and sets up all necessary files and channels'),
    
    async execute(interaction) {
        try {
            // Generate gameId (first 8 characters of a UUID)
            const gameId = uuidv4().substring(0, 8);
            const channelName = `${gameId}_his`;

            // Find or create the "Here I Stand games" category
            let category = interaction.guild.channels.cache.find(
                c => c.type === ChannelType.GuildCategory && c.name === 'Here I Stand games'
            );

            if (!category) {
                category = await interaction.guild.channels.create({
                    name: 'Here I Stand games',
                    type: ChannelType.GuildCategory,
                    reason: 'Category for Here I Stand game channels'
                });
            }

            // Create new channel under the category
            const newChannel = await interaction.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: category.id,
                reason: 'New Here I Stand game channel'
            });

            // Create game directory
            const gameDir = path.join(process.cwd(), 'data', 'games', gameId);
            const templateDir = path.join(process.cwd(), 'data', 'game_template');

            // Copy template directory to new game directory
            await fs.copy(templateDir, gameDir);

            // Create empty command history file
            await fs.writeJson(path.join(gameDir, 'command_history.json'), []);

            await interaction.reply({
                content: `New game created successfully!\nGame ID: ${gameId}\nChannel: ${newChannel.toString()}\nGame data initialized in ${gameDir}`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error creating new game:', error);
            await interaction.reply({
                content: 'There was an error while creating the new game. Please check the logs.',
                ephemeral: true
            });
        }
    },
}; 
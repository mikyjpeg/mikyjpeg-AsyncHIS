const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const { POWERS } = require('../../game/gameState');
const factionManager = require('../../game/factionManager');
const fs = require('fs-extra');
const path = require('path');
const { getGamePath } = require('../../utils/gamePathUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('show_hand')
        .setDescription('Shows the cards in your hand'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true }); // Make the response private

        try {
            // Get the channel name and ensure it's a game-related channel
            const channelName = interaction.channel.name;
            const channelParts = channelName.split(/[_-]/);
            const gameId = channelParts[0];

            if (!gameId || channelParts.length < 2) {
                throw new Error('This command can only be used in a game channel or power channel.');
            }

            // Get the parent channel name if this is a power channel
            const parentChannel = interaction.channel.parent;
            const mainChannelName = parentChannel ? 
                parentChannel.name.endsWith('_his') ? parentChannel.name : channelName :
                channelName;

            // Get the faction manager for this game
            const fm = factionManager(mainChannelName);

            // Find which faction the user controls
            const allFactions = await fm.loadAllFactions();
            const userFaction = Object.values(allFactions).find(f => f.discordUserId === interaction.user.id);

            if (!userFaction) {
                throw new Error('You are not controlling any power in this game.');
            }

            // If we're in a power channel, verify it's the correct one
            if (channelName !== mainChannelName) {
                if (interaction.channel.id !== userFaction.privateChannelId) {
                    throw new Error('You can only view cards in your own power\'s private channel.');
                }
            }

            // Get the cards directory for this game
            const cardsDir = path.join(process.cwd(), getGamePath(mainChannelName), 'cards');

            // Get the faction's cards
            const cards = userFaction.cards || [];
            if (cards.length === 0) {
                await interaction.editReply('You have no cards in your hand.');
                return;
            }

            // Create an embed to display the cards
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`${userFaction.name}'s Hand`)
                .setDescription(`You have ${cards.length} card${cards.length === 1 ? '' : 's'} in your hand:`);

            // Load and add each card's details
            for (const cardId of cards) {
                try {
                    const cardData = await fs.readJson(path.join(cardsDir, `${cardId}.json`));
                    embed.addFields({
                        name: `${cardData.name} (CP: ${cardData.cp})`,
                        value: [
                            cardData.isMandatory ? '🔒 Mandatory' : '',
                            cardData.isResponse ? '↩️ Response' : '',
                            cardData.isCombat ? '⚔️ Combat' : '',
                            cardData.removeAfterUse ? '🗑️ Remove after use' : '',
                            cardData.isForeignWar ? '🌍 Foreign War' : '',
                            cardData.turn ? `Turn: ${cardData.turn}` : '',
                            cardData.year ? `Year: ${cardData.year}` : '',
                            cardData.actions ? `Actions: ${cardData.actions}` : ''
                        ].filter(Boolean).join('\n') || 'Regular card'
                    });
                } catch (error) {
                    console.error(`Error loading card ${cardId}:`, error);
                    embed.addFields({
                        name: `Card ${cardId}`,
                        value: 'Error loading card details'
                    });
                }
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            await interaction.editReply(`Error showing hand: ${error.message}`);
        }
    }
}; 
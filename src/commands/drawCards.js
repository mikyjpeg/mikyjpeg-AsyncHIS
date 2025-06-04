const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('drawcards')
        .setDescription('Draw cards for a specific power')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power drawing cards')
                .setRequired(true)
                .addChoices(
                    { name: 'Ottoman', value: 'ottoman' },
                    { name: 'Hapsburg', value: 'hapsburg' },
                    { name: 'England', value: 'england' },
                    { name: 'France', value: 'france' },
                    { name: 'Papacy', value: 'papacy' },
                    { name: 'Protestant', value: 'protestant' }
                ))
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription('Number of cards to draw')
                .setRequired(true)
                .setMinValue(1)),

    async execute(interaction) {
        try {
            const power = interaction.options.getString('power');
            const count = interaction.options.getInteger('count');
            
            // Read status.json
            const statusPath = path.join(process.cwd(), 'data', 'status.json');
            const status = JSON.parse(fs.readFileSync(statusPath));
            
            // Check if there are enough cards in the deck
            if (status.cardDeck.length < count) {
                await interaction.reply({ 
                    content: `Not enough cards in deck! Only ${status.cardDeck.length} cards remaining.`, 
                    ephemeral: true 
                });
                return;
            }
            
            // Read faction file
            const factionPath = path.join(process.cwd(), 'data', 'factions', `${power}.json`);
            const faction = JSON.parse(fs.readFileSync(factionPath));
            
            // Initialize cards array if it doesn't exist
            if (!faction.cards) {
                faction.cards = [];
            }
            
            // Store old state for history
            const oldState = {
                factionCards: [...faction.cards],
                deckCards: [...status.cardDeck]
            };
            
            // Draw cards
            const drawnCards = status.cardDeck.splice(0, count);
            faction.cards.push(...drawnCards);
            
            // Save updated faction file
            fs.writeFileSync(factionPath, JSON.stringify(faction, null, 2));
            
            // Save updated status file
            fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
            
            // Get card names for the response message
            const drawnCardNames = drawnCards.map(cardId => {
                const cardPath = path.join(process.cwd(), 'data', 'cards', `${cardId}.json`);
                const cardData = JSON.parse(fs.readFileSync(cardPath));
                return `${cardData.name} (${cardData.cp} CP)`;
            });
            
            // Record in command history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.DRAW_CARDS,
                {
                    power,
                    count,
                    drawnCards,
                    oldState,
                    newState: {
                        factionCards: [...faction.cards],
                        deckCards: [...status.cardDeck]
                    }
                }
            );
            
            // Send response
            await interaction.reply({ 
                content: `Drew ${count} cards for ${power}:\n${drawnCardNames.join('\n')}\n(Command ID: ${historyEntry.commandId})`,
                ephemeral: true 
            });
            
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: 'There was an error drawing cards!', 
                ephemeral: true 
            });
        }
    },
}; 
const fs = require('fs').promises;
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('draw_cards')
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
                .setDescription('Number of cards to draw (optional, defaults to power\'s card draw value)')
                .setRequired(false)
                .setMinValue(1)),

    async execute(interaction) {
        try {
            const power = interaction.options.getString('power');
            let count = interaction.options.getInteger('count');
            
            // Read status.json
            const statusPath = path.join(process.cwd(), 'data', 'status.json');
            const statusContent = await fs.readFile(statusPath, 'utf8');
            const status = JSON.parse(statusContent);
            
            // Check if we're in turn 0
            if (status.turn === 0) {
                await interaction.reply({ 
                    content: 'Cards cannot be drawn during turn 0. Use /shuffle_deck first to start turn 1.', 
                    ephemeral: true 
                });
                return;
            }
            
            // Check if the deck is empty
            if (!status.cardDeck || status.cardDeck.length === 0) {
                await interaction.reply({ 
                    content: 'The card deck is empty! Use /shuffle_deck to prepare cards for the current turn.', 
                    ephemeral: true 
                });
                return;
            }

            // Read faction file
            const factionPath = path.join(process.cwd(), 'data', 'factions', `${power}.json`);
            const factionContent = await fs.readFile(factionPath, 'utf8');
            const faction = JSON.parse(factionContent);
            
            // If count is not provided, calculate it from faction data
            if (count === null) {
                // Base count from faction's cardsPerTurn
                count = faction.cardsPerTurn;
                
                // Add cardModifier if present
                if (faction.cardModifier) {
                    count += faction.cardModifier;
                }
                
                // Add cardBonus from current ruler
                if (faction.ruler) {
                    try {
                        // Convert ruler name to lowercase and replace spaces with underscores
                        const rulerFileName = faction.ruler.toLowerCase().replace(/\s+/g, '_');
                        const rulerPath = path.join(process.cwd(), 'data', 'rulers', `${rulerFileName}.json`);
                        const rulerContent = await fs.readFile(rulerPath, 'utf8');
                        const ruler = JSON.parse(rulerContent);
                        if (ruler.cardBonus) {
                            count += ruler.cardBonus;
                        }
                    } catch (error) {
                        console.log(`No ruler file found for ${faction.ruler} or no cardBonus defined`);
                    }
                }
            }
            
            // Check if there are enough cards in the deck
            if (status.cardDeck.length < count) {
                await interaction.reply({ 
                    content: `Not enough cards in deck! Only ${status.cardDeck.length} cards remaining.`, 
                    ephemeral: true 
                });
                return;
            }
            
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
            await fs.writeFile(factionPath, JSON.stringify(faction, null, 2));
            
            // Save updated status file
            await fs.writeFile(statusPath, JSON.stringify(status, null, 2));
            
            // Get card names for the response message
            const drawnCardNames = await Promise.all(drawnCards.map(async cardId => {
                const cardPath = path.join(process.cwd(), 'data', 'cards', `${cardId}.json`);
                const cardContent = await fs.readFile(cardPath, 'utf8');
                const cardData = JSON.parse(cardContent);
                return `${cardData.name} (${cardData.cp} CP)`;
            }));
            
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
            const countSource = interaction.options.getInteger('count') === null ? ' (automatically calculated)' : '';
            await interaction.reply({ 
                content: `Drew ${count}${countSource} cards for ${power}:\n${drawnCardNames.join('\n')}\n(Command ID: ${historyEntry.commandId})`,
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
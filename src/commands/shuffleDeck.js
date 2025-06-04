const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../game/commandHistoryManager');

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffledeck')
        .setDescription('Shuffles the deck for a specific turn')
        .addIntegerOption(option =>
            option.setName('turn')
                .setDescription('The turn number (0-9)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(9)),

    async execute(interaction) {
        try {
            const turn = interaction.options.getInteger('turn');
            
            // Read all card files from data/cards directory
            const cardsDir = path.join(process.cwd(), 'data', 'cards');
            const cardFiles = fs.readdirSync(cardsDir);
            
            // Filter and collect valid cards based on turn
            const validCards = [];
            for (const file of cardFiles) {
                if (!file.endsWith('.json')) continue;
                
                const cardData = JSON.parse(fs.readFileSync(path.join(cardsDir, file)));
                
                if (turn === 0) {
                    // For turn 0, include all cards that don't have a specific turn
                    if (cardData.turn === null) {
                        validCards.push(cardData.id);
                    }
                } else {
                    // For other turns, include cards with matching turn or null turn
                    if (cardData.turn === null || cardData.turn === turn.toString()) {
                        validCards.push(cardData.id);
                    }
                }
            }
            
            // Shuffle the valid cards
            const shuffledDeck = shuffleArray([...validCards]);
            
            // Read the status.json
            const statusPath = path.join(process.cwd(), 'data', 'status.json');
            const status = JSON.parse(fs.readFileSync(statusPath));
            
            // Store old state for history
            const oldState = {
                cardDeck: [...status.cardDeck],
                discardedCards: [...status.discardedCards],
                playedCards: [...status.playedCards],
                currentCardIndex: status.currentCardIndex
            };
            
            // Update the status
            status.cardDeck = shuffledDeck;
            status.discardedCards = [];
            status.playedCards = [];
            status.currentCardIndex = 0;
            
            fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
            
            // Record in command history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.SHUFFLE_DECK,
                {
                    turn,
                    oldState,
                    newState: {
                        cardDeck: [...shuffledDeck],
                        discardedCards: [],
                        playedCards: [],
                        currentCardIndex: 0
                    }
                }
            );
            
            await interaction.reply(`Deck shuffled for turn ${turn}. ${shuffledDeck.length} cards in deck. (Command ID: ${historyEntry.commandId})`);
            
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error shuffling the deck!', ephemeral: true });
        }
    },
}; 
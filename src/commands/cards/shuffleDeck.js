const fs = require('fs').promises;
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

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
        await interaction.deferReply();
        
        try {
            const turn = interaction.options.getInteger('turn');
            
            // Read all card files from data/cards directory
            const cardsDir = path.join(process.cwd(), 'data', 'cards');
            const cardFiles = await fs.readdir(cardsDir);
            
            // Filter and collect valid cards based on turn
            const validCards = [];
            for (const file of cardFiles) {
                if (!file.endsWith('.json')) continue;
                
                const cardContent = await fs.readFile(path.join(cardsDir, file), 'utf8');
                const cardData = JSON.parse(cardContent);
                
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
            const statusContent = await fs.readFile(statusPath, 'utf8');
            const status = JSON.parse(statusContent);
            
            // Store old state for history
            const oldState = {
                cardDeck: [...status.cardDeck],
                discardedCards: [...(status.discardedCards || [])],
                playedCards: [...(status.playedCards || [])],
                currentCardIndex: status.currentCardIndex
            };
            
            // Update the status
            status.cardDeck = shuffledDeck;
            status.discardedCards = [];
            status.playedCards = [];
            status.currentCardIndex = 0;
            
            await fs.writeFile(statusPath, JSON.stringify(status, null, 2));
            
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
            
            await interaction.editReply(`Deck shuffled for turn ${turn}. ${shuffledDeck.length} cards in deck. (Command ID: ${historyEntry.commandId})`);
            
        } catch (error) {
            console.error('Error in shuffle deck command:', error);
            await interaction.editReply({ 
                content: `Error shuffling deck: ${error.message}`,
                ephemeral: true 
            });
        }
    },
}; 
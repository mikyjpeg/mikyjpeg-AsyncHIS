const fs = require('fs').promises;
const path = require('path');

class CardManager {
    constructor() {
        this.statusPath = path.join(process.cwd(), 'data', 'status.json');
    }

    async validateTurn() {
        const status = await this.getStatus();
        if (status.turn === 0) {
            throw new Error('Cards cannot be drawn during turn 0. Use /shuffle_deck first to start turn 1.');
        }
    }

    async validateDeckNotEmpty() {
        const status = await this.getStatus();
        if (!status.cardDeck || status.cardDeck.length === 0) {
            throw new Error('The card deck is empty! Use /shuffle_deck to prepare cards for the current turn.');
        }
    }

    async validateEnoughCards(count) {
        const status = await this.getStatus();
        if (status.cardDeck.length < count) {
            throw new Error(`Not enough cards in deck! Only ${status.cardDeck.length} cards remaining.`);
        }
    }

    async getStatus() {
        const content = await fs.readFile(this.statusPath, 'utf8');
        return JSON.parse(content);
    }

    async saveStatus(status) {
        await fs.writeFile(this.statusPath, JSON.stringify(status, null, 2));
    }

    async getFaction(power) {
        const factionPath = path.join(process.cwd(), 'data', 'factions', `${power}.json`);
        const content = await fs.readFile(factionPath, 'utf8');
        return JSON.parse(content);
    }

    async saveFaction(power, faction) {
        const factionPath = path.join(process.cwd(), 'data', 'factions', `${power}.json`);
        await fs.writeFile(factionPath, JSON.stringify(faction, null, 2));
    }

    async getRuler(rulerName) {
        try {
            const rulerFileName = rulerName.toLowerCase().replace(/\s+/g, '_');
            const rulerPath = path.join(process.cwd(), 'data', 'rulers', `${rulerFileName}.json`);
            const content = await fs.readFile(rulerPath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            console.log(`No ruler file found for ${rulerName} or no cardBonus defined`);
            return null;
        }
    }

    async getCard(cardId) {
        const cardPath = path.join(process.cwd(), 'data', 'cards', `${cardId}.json`);
        const content = await fs.readFile(cardPath, 'utf8');
        return JSON.parse(content);
    }

    async calculateDrawCount(power) {
        const faction = await this.getFaction(power);
        let count = faction.cardsPerTurn;

        if (faction.cardModifier) {
            count += faction.cardModifier;
        }

        if (faction.ruler) {
            const ruler = await this.getRuler(faction.ruler);
            if (ruler?.cardBonus) {
                count += ruler.cardBonus;
            }
        }

        return count;
    }

    async drawCards(power, count) {
        // Get current state
        const status = await this.getStatus();
        const faction = await this.getFaction(power);

        // Initialize cards array if it doesn't exist
        if (!faction.cards) {
            faction.cards = [];
        }

        // Store old state
        const oldState = {
            factionCards: [...faction.cards],
            deckCards: [...status.cardDeck]
        };

        // Draw cards
        const drawnCards = status.cardDeck.splice(0, count);
        faction.cards.push(...drawnCards);

        // Save updated state
        await this.saveStatus(status);
        await this.saveFaction(power, faction);

        // Get card details
        const drawnCardDetails = await Promise.all(drawnCards.map(async cardId => {
            const card = await this.getCard(cardId);
            return {
                id: cardId,
                name: card.name,
                cp: card.cp
            };
        }));

        return {
            drawnCards,
            drawnCardDetails,
            oldState,
            newState: {
                factionCards: [...faction.cards],
                deckCards: [...status.cardDeck]
            }
        };
    }

    async shuffleDeck(turn) {
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
        const shuffledDeck = this.shuffleArray([...validCards]);
        
        // Read and update the status
        const status = await this.getStatus();
        
        // Store old state
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
        
        await this.saveStatus(status);
        
        return {
            oldState,
            newState: {
                cardDeck: [...shuffledDeck],
                discardedCards: [],
                playedCards: [],
                currentCardIndex: 0
            },
            deckSize: shuffledDeck.length
        };
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

module.exports = new CardManager(); 
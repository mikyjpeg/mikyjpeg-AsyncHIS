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

    isCardInAnyPile(cardId, status) {
        return (
            status.cardDeck.includes(cardId) ||
            (status.discardedCards && status.discardedCards.includes(cardId)) ||
            (status.playedCards && status.playedCards.includes(cardId))
        );
    }

    async shuffleDeck(turn) {
        // Read all card files from data/cards directory
        const cardsDir = path.join(process.cwd(), 'data', 'cards');
        const cardFiles = await fs.readdir(cardsDir);
        
        // Get current status
        const status = await this.getStatus();
        
        // Store old state
        const oldState = {
            cardDeck: [...status.cardDeck],
            discardedCards: [...(status.discardedCards || [])],
            playedCards: [...(status.playedCards || [])],
            currentCardIndex: status.currentCardIndex
        };

        let cardsToShuffle = [];
        
        if (turn === 0) {
            // For turn 0, only include cards that don't have a specific turn
            for (const file of cardFiles) {
                if (!file.endsWith('.json')) continue;
                
                const cardContent = await fs.readFile(path.join(cardsDir, file), 'utf8');
                const cardData = JSON.parse(cardContent);
                
                if (cardData.turn === null) {
                    cardsToShuffle.push(cardData.id);
                }
            }
        } else {
            // For other turns:
            // 1. Include all cards from current deck
            cardsToShuffle.push(...status.cardDeck);
            
            // 2. Include all cards from played pile
            if (status.playedCards) {
                cardsToShuffle.push(...status.playedCards);
            }
            
            // 3. Add any new cards for this turn from data/cards
            for (const file of cardFiles) {
                if (!file.endsWith('.json')) continue;
                
                const cardContent = await fs.readFile(path.join(cardsDir, file), 'utf8');
                const cardData = JSON.parse(cardContent);
                
                // Add cards that match the current turn
                if (cardData.turn === turn.toString()) {
                    cardsToShuffle.push(cardData.id);
                }
            }

            // 4. Handle special card conditions
            // Book of Common Prayer (62), Dissolution of the Monasteries (63), Pilgrimage of Grace (64)
            if ([4,5,6,7,8,9].includes(turn) && status.hasHenryMarriedAnneBoylen) {
                const henryCards = [62, 63, 64];
                for (const cardId of henryCards) {
                    if (!this.isCardInAnyPile(cardId, status)) {
                        cardsToShuffle.push(cardId);
                    }
                }
            }

            // Edward VI (19)
            if ([6,7,8,9].includes(turn) && status.hasEdwardVIBorn) {
                if (!this.isCardInAnyPile(19, status)) {
                    cardsToShuffle.push(19);
                }
            }

            // Mary I (21)
            if ([6,7,8,9].includes(turn) && 
                (status.hasEdwardVIBorn === false || status.isSicklyEdwardRuling)) {
                if (!this.isCardInAnyPile(21, status)) {
                    cardsToShuffle.push(21);
                }
            }

            // Elizabeth I (23)
            if ([7,8,9].includes(turn) && 
                status.hasElizabethIborn && 
                status.isMaryIRuling) {
                if (!this.isCardInAnyPile(23, status)) {
                    cardsToShuffle.push(23);
                }
            }
        }
        
        // Remove duplicates (in case a card was somehow both in deck and discarded)
        cardsToShuffle = [...new Set(cardsToShuffle)];
        
        // Shuffle the cards
        const shuffledDeck = this.shuffleArray(cardsToShuffle);
        
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
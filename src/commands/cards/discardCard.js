const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const cardManager = require('../../game/cardManager');
const path = require('path');
const fs = require('fs').promises;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('discard_card')
        .setDescription('Discard a card, either the current card or a specific one')
        .addIntegerOption(option =>
            option.setName('card_id')
                .setDescription('The ID of the card to discard (optional, defaults to current card)')
                .setRequired(false)
                .setMinValue(1)),

    async execute(interaction) {
        try {
            const channelName = interaction.channel.name;
            
            // Get card manager for this game
            const cm = cardManager(channelName);

            // Get current status
            const status = await cm.getStatus();

            // Initialize response message parts
            let responseMessage = [];
            let oldState = {};
            let newState = {};
            
            // Determine which card to discard
            const cardId = interaction.options.getInteger('card_id') || status.currentCardIndex;
            
            if (!cardId) {
                throw new Error('No card to discard - no card ID provided and no current card set');
            }

            // Convert cardId to string for array operations
            const cardIdStr = cardId.toString();

            // Store old state
            oldState = {
                currentCardIndex: status.currentCardIndex,
                removedCards: [...(status.removedCards || [])],
                discardedCards: [...(status.discardedCards || [])],
                cardDeck: [...(status.cardDeck || [])]
            };

            // If a specific card_id was provided, we need to find and remove it from its current location
            if (interaction.options.getInteger('card_id')) {
                // First check if it's in the deck
                if (status.cardDeck.includes(cardIdStr)) {
                    status.cardDeck = status.cardDeck.filter(id => id !== cardIdStr);
                    responseMessage.push(`Removed card ${cardId} from the deck`);
                } else {
                    // Check all factions
                    const factionsDir = path.join(process.cwd(), 'data', 'games', channelName, 'factions');
                    const factionFiles = await fs.readdir(factionsDir);
                    let found = false;

                    for (const file of factionFiles) {
                        if (!file.endsWith('.json')) continue;

                        const faction = await cm.getFaction(file.replace('.json', ''));
                        if (faction.cards && faction.cards.includes(cardIdStr)) {
                            faction.cards = faction.cards.filter(id => id !== cardIdStr);
                            await cm.saveFaction(file.replace('.json', ''), faction);
                            responseMessage.push(`Removed card ${cardId} from ${file.replace('.json', '')}'s hand`);
                            found = true;
                            
                            // Store faction cards in old state
                            oldState[`faction_${file.replace('.json', '')}`] = [...faction.cards];
                            break;
                        }
                    }

                    if (!found) {
                        throw new Error(`Card ${cardId} not found in deck or any faction's hand`);
                    }
                }
            }

            // Get card details to check removeAfterUse
            const card = await cm.getCard(cardId);

            // Determine where to move the card
            if (card.removeAfterUse) {
                status.removedCards = status.removedCards || [];
                status.removedCards.push(cardIdStr);
                responseMessage.push(`Card ${cardId} (${card.name}) moved to removed cards pile`);
            } else {
                status.discardedCards = status.discardedCards || [];
                status.discardedCards.push(cardIdStr);
                responseMessage.push(`Card ${cardId} (${card.name}) moved to discarded cards pile`);
            }

            // If we discarded the current card, clear the current card index
            if (cardId === status.currentCardIndex) {
                status.currentCardIndex = null;
                responseMessage.push('Cleared current card');
            }

            // Save the new state
            await cm.saveStatus(status);

            // Update new state for history
            newState = {
                currentCardIndex: status.currentCardIndex,
                removedCards: [...(status.removedCards || [])],
                discardedCards: [...(status.discardedCards || [])],
                cardDeck: [...(status.cardDeck || [])]
            };

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.DISCARD_CARD,
                {
                    cardId,
                    oldState,
                    newState
                }
            );

            // Send response
            await interaction.reply({ 
                content: `${responseMessage.join('\n')}\n(Command ID: ${historyEntry.commandId})`,
                ephemeral: true 
            });

        } catch (error) {
            console.error('Error in discard_card command:', error);
            await interaction.reply({ 
                content: error.message || 'There was an error discarding the card!', 
                ephemeral: true 
            });
        }
    }
}; 
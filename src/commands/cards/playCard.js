const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const cardManager = require('../../game/cardManager');
const path = require('path');
const fs = require('fs').promises;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play_card')
        .setDescription('Play a card from the deck or a faction\'s hand')
        .addIntegerOption(option =>
            option.setName('card_id')
                .setDescription('The ID of the card to play')
                .setRequired(true)
                .setMinValue(1))
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power playing the card (if card is from faction\'s hand)')
                .setRequired(false)
                .addChoices(
                    { name: 'Ottoman', value: 'ottoman' },
                    { name: 'Hapsburg', value: 'hapsburg' },
                    { name: 'England', value: 'england' },
                    { name: 'France', value: 'france' },
                    { name: 'Papacy', value: 'papacy' },
                    { name: 'Protestant', value: 'protestant' }
                )),

    async execute(interaction) {
        try {
            const cardId = interaction.options.getInteger('card_id');
            const power = interaction.options.getString('power');

            // Get current status
            const status = await cardManager.getStatus();

            // Initialize response message parts
            let responseMessage = [];
            let oldState = {};
            let newState = {};

            // Convert cardId to string for comparison
            const cardIdStr = cardId.toString();

            // If power is specified, validate and remove card from faction's hand
            if (power) {
                const faction = await cardManager.getFaction(power);
                
                // Validate card is in faction's hand
                if (!faction.cards || !faction.cards.includes(cardIdStr)) {
                    throw new Error(`Card ${cardId} not found in ${power}'s hand`);
                }

                // Store old state
                oldState = {
                    factionCards: [...faction.cards],
                    currentCardIndex: status.currentCardIndex
                };

                // Remove card from faction's hand
                faction.cards = faction.cards.filter(id => id !== cardIdStr);
                await cardManager.saveFaction(power, faction);

                responseMessage.push(`Removed card ${cardId} from ${power}'s hand`);
                
                // Update new state
                newState = {
                    factionCards: [...faction.cards],
                    currentCardIndex: cardId
                };
            } else {
                // Playing from deck - validate card is in deck
                if (!status.cardDeck.includes(cardIdStr)) {
                    throw new Error(`Card ${cardId} not found in the deck`);
                }

                // Store old state
                oldState = {
                    cardDeck: [...status.cardDeck],
                    currentCardIndex: status.currentCardIndex
                };

                // Remove card from deck
                status.cardDeck = status.cardDeck.filter(id => id !== cardIdStr);
                responseMessage.push(`Removed card ${cardId} from the deck`);

                // Update new state
                newState = {
                    cardDeck: [...status.cardDeck],
                    currentCardIndex: cardId
                };
            }

            // Set the current card index
            status.currentCardIndex = cardId;
            await cardManager.saveStatus(status);

            // Get card details for the response
            const card = await cardManager.getCard(cardId);
            responseMessage.push(`Set current card to: ${card.name} (${card.cp} CP)`);

            // Record in command history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.PLAY_CARD,
                {
                    cardId,
                    power,
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
            console.error('Error in play_card command:', error);
            await interaction.reply({ 
                content: error.message || 'There was an error playing the card!', 
                ephemeral: true 
            });
        }
    }
}; 
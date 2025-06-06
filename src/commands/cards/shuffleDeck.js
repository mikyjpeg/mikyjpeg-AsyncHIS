const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const cardManager = require('../../game/cardManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle_deck')
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
            const channelName = interaction.channel.name;
            
            // Get card manager for this game
            const cm = cardManager(channelName);
            
            // Shuffle the deck
            const result = await cm.shuffleDeck(turn);
            
            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.SHUFFLE_DECK,
                {
                    turn,
                    oldState: result.oldState,
                    newState: result.newState
                }
            );
            
            await interaction.editReply(
                `Deck shuffled for turn ${turn}. ${result.deckSize} cards in deck. (Command ID: ${historyEntry.commandId})`
            );
            
        } catch (error) {
            console.error('Error in shuffle deck command:', error);
            await interaction.editReply({ 
                content: error.message || 'Error shuffling deck!',
                ephemeral: true 
            });
        }
    },
}; 
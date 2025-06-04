const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const cardManager = require('../../game/cardManager');

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
            
            // Validate turn and deck state
            await cardManager.validateTurn();
            await cardManager.validateDeckNotEmpty();
            
            // Get or calculate the number of cards to draw
            let count = interaction.options.getInteger('count');
            if (count === null) {
                count = await cardManager.calculateDrawCount(power);
            }
            
            // Validate we have enough cards
            await cardManager.validateEnoughCards(count);
            
            // Draw the cards
            const result = await cardManager.drawCards(power, count);
            
            // Record in command history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.DRAW_CARDS,
                {
                    power,
                    count,
                    drawnCards: result.drawnCards,
                    oldState: result.oldState,
                    newState: result.newState
                }
            );
            
            // Format card names for display
            const cardList = result.drawnCardDetails.map(card => 
                `${card.name} (${card.cp} CP)`
            );
            
            // Send response
            const countSource = interaction.options.getInteger('count') === null ? ' (automatically calculated)' : '';
            await interaction.reply({ 
                content: `Drew ${count}${countSource} cards for ${power}:\n${cardList.join('\n')}\n(Command ID: ${historyEntry.commandId})`,
                ephemeral: true 
            });
            
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: error.message || 'There was an error drawing cards!', 
                ephemeral: true 
            });
        }
    },
}; 
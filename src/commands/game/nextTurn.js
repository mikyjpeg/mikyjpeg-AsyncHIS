const { SlashCommandBuilder } = require('discord.js');
const statusManager = require('../../game/statusManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('next_turn')
        .setDescription('Advance to the next turn'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            // Get the channel name
            const channelName = interaction.channel.name;

            // Get the status manager for this game
            const sm = statusManager(channelName);

            // Get current status
            const status = await sm.getStatus();
            const newTurn = (status.turn || 1) + 1;
            
            if (newTurn > 9) {
                await interaction.editReply('Cannot advance beyond turn 9!');
                return;
            }

            // Update status
            const previousStatus = { ...status };
            status.turn = newTurn;
            status.phase = 'Spring Deployment'; // Reset phase for new turn
            await sm.updateStatus(status);

            // Record in history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.NEXT_TURN,
                {
                    previousStatus,
                    newStatus: status
                }
            );

            await interaction.editReply(`Advanced to turn ${newTurn}! (Command ID: ${historyEntry.commandId})`);
        } catch (error) {
            await interaction.editReply(`Failed to advance turn: ${error.message}`);
        }
    }
}; 
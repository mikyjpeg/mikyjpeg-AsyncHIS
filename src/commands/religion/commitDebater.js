const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const debaterManager = require('../../game/debaterManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('commit_debater')
        .setDescription('Commit a debater to a debate')
        .addStringOption(option =>
            option.setName('debater')
                .setDescription('The debater to commit')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        const debaterName = interaction.options.getString('debater');
        const channelName = interaction.channel.name;

        try {
            // Get debater manager for this game
            const dm = debaterManager(channelName);
            
            // Get the debater
            const debater = await dm.getDebater(debaterName);
            
            if (!debater) {
                throw new Error(`Debater ${debaterName} not found`);
            }

            if (debater.isCommitted) {
                throw new Error(`${debaterName} is already committed`);
            }

            // Store old state
            const oldState = { ...debater };

            // Update debater
            debater.isCommitted = true;
            await dm.updateDebater(debaterName, debater);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.COMMIT_DEBATER,
                {
                    debaterName,
                    oldState,
                    newState: debater
                }
            );

            await interaction.editReply(
                `${debaterName} has been committed to the debate! (Command ID: ${historyEntry.commandId})`
            );
        } catch (error) {
            await interaction.editReply(`Failed to commit debater: ${error.message}`);
        }
    }
}; 
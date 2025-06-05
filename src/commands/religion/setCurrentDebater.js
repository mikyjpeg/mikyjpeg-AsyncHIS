const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const debaterManager = require('../../game/debaterManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set_current_debater')
        .setDescription('Set the current debater')
        .addStringOption(option =>
            option.setName('debater')
                .setDescription('The debater to set as current')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        const debaterName = interaction.options.getString('debater');

        try {
            // Get all debaters
            const allDebaters = await debaterManager(interaction.channelId).getAllDebaters();
            
            // Get the target debater
            const debater = allDebaters.find(d => d.name === debaterName);
            if (!debater) {
                throw new Error(`Debater ${debaterName} not found`);
            }

            // Find current debater if any
            const currentDebater = allDebaters.find(d => d.isCurrentDebater);
            if (currentDebater && currentDebater.name === debaterName) {
                throw new Error(`${debaterName} is already the current debater`);
            }

            // Store old states
            const oldStates = [];
            if (currentDebater) {
                oldStates.push({
                    debaterName: currentDebater.name,
                    oldState: { ...currentDebater },
                });
                // Clear current debater
                currentDebater.isCurrentDebater = false;
                await debaterManager(interaction.channelId).updateDebater(currentDebater.name, currentDebater);
            }

            // Store old state of new debater
            oldStates.push({
                debaterName: debater.name,
                oldState: { ...debater },
            });

            // Set new current debater
            debater.isCurrentDebater = true;
            await debaterManager(interaction.channelId).updateDebater(debater.name, debater);

            // Record in command history
            const historyEntry = await commandHistory(interaction.channelId).recordSlashCommand(
                interaction,
                COMMAND_TYPES.SET_CURRENT_DEBATER,
                {
                    oldStates,
                    newDebater: debater.name
                }
            );

            const prevDebaterMsg = currentDebater ? ` (was ${currentDebater.name})` : '';
            await interaction.editReply(
                `Set ${debaterName} as current debater${prevDebaterMsg} (Command ID: ${historyEntry.commandId})`
            );
        } catch (error) {
            await interaction.editReply(`Failed to set current debater: ${error.message}`);
        }
    }
}; 
const { SlashCommandBuilder } = require('discord.js');
const { POWERS } = require('../../game/gameState');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const diplomacyManager = require('../../game/diplomacyManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ally')
        .setDescription('Form an alliance between two powers')
        .addStringOption(option =>
            option.setName('power1')
                .setDescription('First power')
                .setRequired(true)
                .addChoices(...Object.values(POWERS).map(power => ({
                    name: power,
                    value: power
                }))))
        .addStringOption(option =>
            option.setName('power2')
                .setDescription('Second power')
                .setRequired(true)
                .addChoices(...Object.values(POWERS).map(power => ({
                    name: power,
                    value: power
                })))),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const power1 = interaction.options.getString('power1');
        const power2 = interaction.options.getString('power2');
        
        try {
            // Check if powers are different
            if (power1 === power2) {
                await interaction.editReply('A power cannot ally with itself');
                return;
            }

            // Get the channel name
            const channelName = interaction.channel.name;

            // Get the diplomacy manager for this game
            const dm = diplomacyManager(channelName);

            // Get current states
            const faction1 = await dm.getFaction(power1);
            const faction2 = await dm.getFaction(power2);

            // Check if they are at war
            if (faction1.atWarWith?.includes(power2) || faction2.atWarWith?.includes(power1)) {
                await interaction.editReply(`${power1} and ${power2} cannot form an alliance while at war`);
                return;
            }

            // Check if alliance already exists
            if (faction1.alliances?.includes(power2) || faction2.alliances?.includes(power1)) {
                await interaction.editReply(`${power1} and ${power2} already have an alliance`);
                return;
            }

            // Form the alliance
            const { faction1: updatedFaction1, faction2: updatedFaction2 } = await dm.declareAlliance(power1, power2);
            
            // Record in history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.FORM_ALLIANCE,
                {
                    power1,
                    power2,
                    faction1: updatedFaction1,
                    faction2: updatedFaction2
                }
            );

            await interaction.editReply(`Alliance formed between ${power1} and ${power2} (Command ID: ${historyEntry.commandId})`);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to form alliance: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
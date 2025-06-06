const { SlashCommandBuilder } = require('discord.js');
const { GameState, POWERS } = require('../../game/gameState');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('form_alliance')
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
        const channelName = interaction.channel.name;
        
        try {
            // Check if powers are different
            if (power1 === power2) {
                await interaction.editReply('A power cannot ally with itself');
                return;
            }

            // Load current game state
            const gameState = await GameState.load(channelName);
            
            // Store old state for history
            const oldState = { ...gameState };
            
            // Initialize alliances array if it doesn't exist
            if (!gameState.alliances) {
                gameState.alliances = [];
            }

            // Check if they are at war
            if (gameState.wars && gameState.wars.some(war => 
                (war.attacker === power1 && war.defender === power2) ||
                (war.attacker === power2 && war.defender === power1)
            )) {
                await interaction.editReply(`${power1} and ${power2} cannot form an alliance while at war`);
                return;
            }

            // Check if alliance already exists
            if (gameState.alliances.some(alliance => 
                (alliance.power1 === power1 && alliance.power2 === power2) ||
                (alliance.power1 === power2 && alliance.power2 === power1)
            )) {
                await interaction.editReply(`${power1} and ${power2} already have an alliance`);
                return;
            }

            // Add the alliance
            const newAlliance = {
                power1,
                power2,
                startTurn: gameState.turn || 1
            };
            gameState.alliances.push(newAlliance);
            await GameState.save(channelName, gameState);
            
            // Record in history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.FORM_ALLIANCE,
                {
                    power1,
                    power2,
                    oldState,
                    newState: { ...gameState },
                    alliance: newAlliance
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
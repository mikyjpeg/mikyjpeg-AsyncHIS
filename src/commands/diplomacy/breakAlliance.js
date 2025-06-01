const { SlashCommandBuilder } = require('discord.js');
const { GameState, POWERS } = require('../../game/gameState');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const factionManager = require('../../game/factionManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('break_alliance')
        .setDescription('Break an alliance between two powers')
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
                await interaction.editReply('A power cannot have an alliance with itself');
                return;
            }

            // Load current game state
            const gameState = await GameState.load();
            
            // Initialize alliances array if it doesn't exist
            if (!gameState.alliances) {
                gameState.alliances = [];
            }

            // Check if alliance exists
            const allianceIndex = gameState.alliances.findIndex(alliance => 
                (alliance.power1 === power1 && alliance.power2 === power2) ||
                (alliance.power1 === power2 && alliance.power2 === power1)
            );

            if (allianceIndex === -1) {
                await interaction.editReply(`${power1} and ${power2} do not have an alliance`);
                return;
            }

            // Remove the alliance from game state
            const removedAlliance = gameState.alliances.splice(allianceIndex, 1)[0];
            await GameState.save(gameState);

            // Update faction files
            const faction1 = await factionManager.getFaction(power1);
            const faction2 = await factionManager.getFaction(power2);

            // Remove alliance from each faction
            if (faction1.alliances) {
                faction1.alliances = faction1.alliances.filter(p => p !== power2);
            }
            if (faction2.alliances) {
                faction2.alliances = faction2.alliances.filter(p => p !== power1);
            }

            await factionManager.updateFaction(power1, faction1);
            await factionManager.updateFaction(power2, faction2);
            
            // Record in history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.BREAK_ALLIANCE,
                {
                    ...removedAlliance,
                    faction1,
                    faction2
                }
            );

            await interaction.editReply(`Alliance broken between ${power1} and ${power2} (Command ID: ${historyEntry.commandId})`);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to break alliance: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
const { SlashCommandBuilder } = require('discord.js');
const { GameState, POWERS } = require('../../game/gameState');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const factionManager = require('../../game/factionManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('make_peace')
        .setDescription('Make peace between two powers at war')
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
                await interaction.editReply('A power cannot be at war with itself');
                return;
            }

            // Load current game state
            const gameState = await GameState.load();
            
            // Initialize wars array if it doesn't exist
            if (!gameState.wars) {
                gameState.wars = [];
            }

            // Check if they are at war
            const warIndex = gameState.wars.findIndex(war => 
                (war.attacker === power1 && war.defender === power2) ||
                (war.attacker === power2 && war.defender === power1)
            );

            if (warIndex === -1) {
                await interaction.editReply(`${power1} and ${power2} are not at war`);
                return;
            }

            // Remove the war from game state
            const removedWar = gameState.wars.splice(warIndex, 1)[0];
            await GameState.save(gameState);

            // Update faction files
            const faction1 = await factionManager.getFaction(power1);
            const faction2 = await factionManager.getFaction(power2);

            // Remove war from each faction
            if (faction1.atWarWith) {
                faction1.atWarWith = faction1.atWarWith.filter(p => p !== power2);
            }
            if (faction2.atWarWith) {
                faction2.atWarWith = faction2.atWarWith.filter(p => p !== power1);
            }

            await factionManager.updateFaction(power1, faction1);
            await factionManager.updateFaction(power2, faction2);
            
            // Record in history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.MAKE_PEACE,
                {
                    ...removedWar,
                    faction1,
                    faction2
                }
            );

            await interaction.editReply(`Peace made between ${power1} and ${power2} (Command ID: ${historyEntry.commandId})`);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to make peace: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
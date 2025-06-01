const { SlashCommandBuilder } = require('discord.js');
const { GameState, POWERS } = require('../../game/gameState');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const factionManager = require('../../game/factionManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('declare_war')
        .setDescription('Declare war between two powers')
        .addStringOption(option =>
            option.setName('attacker')
                .setDescription('The power declaring war')
                .setRequired(true)
                .addChoices(...Object.values(POWERS).map(power => ({
                    name: power,
                    value: power
                }))))
        .addStringOption(option =>
            option.setName('defender')
                .setDescription('The power being declared war upon')
                .setRequired(true)
                .addChoices(...Object.values(POWERS).map(power => ({
                    name: power,
                    value: power
                })))),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const attacker = interaction.options.getString('attacker');
        const defender = interaction.options.getString('defender');
        
        try {
            // Check if powers are different
            if (attacker === defender) {
                await interaction.editReply('A power cannot declare war on itself');
                return;
            }

            // Load current game state
            const gameState = await GameState.load();
            
            // Initialize wars array if it doesn't exist
            if (!gameState.wars) {
                gameState.wars = [];
            }

            // Check if they are already at war
            if (gameState.wars.some(war => 
                (war.attacker === attacker && war.defender === defender) ||
                (war.attacker === defender && war.defender === attacker)
            )) {
                await interaction.editReply(`${attacker} and ${defender} are already at war`);
                return;
            }

            // Check if they have an alliance
            if (gameState.alliances && gameState.alliances.some(alliance => 
                (alliance.power1 === attacker && alliance.power2 === defender) ||
                (alliance.power1 === defender && alliance.power2 === attacker)
            )) {
                await interaction.editReply(`${attacker} and ${defender} have an alliance. Break the alliance first.`);
                return;
            }

            // Add the war to game state
            const newWar = {
                attacker,
                defender,
                startTurn: gameState.turn || 1
            };
            gameState.wars.push(newWar);
            await GameState.save(gameState);

            // Update faction files
            const attackerFaction = await factionManager.getFaction(attacker);
            const defenderFaction = await factionManager.getFaction(defender);

            // Add war to each faction
            if (!attackerFaction.atWarWith) attackerFaction.atWarWith = [];
            if (!defenderFaction.atWarWith) defenderFaction.atWarWith = [];
            
            attackerFaction.atWarWith.push(defender);
            defenderFaction.atWarWith.push(attacker);

            await factionManager.updateFaction(attacker, attackerFaction);
            await factionManager.updateFaction(defender, defenderFaction);
            
            // Record in history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.DECLARE_WAR,
                {
                    ...newWar,
                    attackerFaction,
                    defenderFaction
                }
            );

            await interaction.editReply(`War declared between ${attacker} and ${defender} (Command ID: ${historyEntry.commandId})`);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to declare war: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
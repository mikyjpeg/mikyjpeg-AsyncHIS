const { SlashCommandBuilder } = require('discord.js');
const { POWERS } = require('../../game/gameState');
const rulerManager = require('../../game/rulerManager');
const rulerSuccessionManager = require('../../game/rulerSuccessionManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list_rulers')
        .setDescription('List rulers of a power or all powers')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('Power to list rulers for (optional)')
                .setRequired(false)
                .addChoices(...Object.values(POWERS).map(power => ({
                    name: power,
                    value: power
                })))),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const power = interaction.options.getString('power');
        const channelName = interaction.channel.name;
        
        try {
            // Get managers for this game
            const rm = rulerManager(channelName);
            const rsm = rulerSuccessionManager(channelName);

            let response = '';
            
            if (power) {
                // Get rulers for specific power
                const rulers = await rm.getRulersByPower(power);
                if (!rulers || rulers.length === 0) {
                    await interaction.editReply(`No rulers found for ${power}`);
                    return;
                }

                response = `**Rulers of ${power}:**\n`;
                
                // Get succession paths for ordering
                const successionPaths = rsm.successionPaths[power] || [];
                const orderedRulers = [];
                
                // Start with current ruler
                const currentRuler = rulers.find(r => r.isCurrentRuler);
                if (currentRuler) {
                    orderedRulers.push(currentRuler);
                    
                    // Follow succession paths to order the rest
                    let lastRuler = currentRuler;
                    while (true) {
                        const nextPath = successionPaths.find(path => path[0] === lastRuler.name);
                        if (!nextPath) break;
                        
                        const nextRuler = rulers.find(r => r.name === nextPath[1]);
                        if (!nextRuler || orderedRulers.includes(nextRuler)) break;
                        
                        orderedRulers.push(nextRuler);
                        lastRuler = nextRuler;
                    }
                    
                    // Add any remaining rulers that aren't in the succession path
                    rulers.forEach(ruler => {
                        if (!orderedRulers.includes(ruler)) {
                            orderedRulers.push(ruler);
                        }
                    });
                } else {
                    // If no current ruler, just use all rulers
                    orderedRulers.push(...rulers);
                }

                // Display rulers in order
                orderedRulers.forEach(ruler => {
                    const status = [];
                    if (ruler.isCurrentRuler) status.push('Current');
                    if (ruler.excommunicated) status.push('Excommunicated');
                    
                    response += `${ruler.name}` + 
                        (status.length > 0 ? ` (${status.join(', ')})` : '') +
                        `\n  Battle Rating: ${ruler.battleRating}, Command Rating: ${ruler.commandRating}, Admin Rating: ${ruler.adminRating}` +
                        (ruler.cardBonus ? `, Card Bonus: ${ruler.cardBonus}` : '') +
                        (ruler.otherinfo ? `\n  Special: ${ruler.otherinfo}` : '') +
                        '\n';
                });
            } else {
                // Get all rulers grouped by power
                const allRulers = await rm.getAllRulers();
                const rulersByPower = {};
                
                // Group rulers by power
                allRulers.forEach(ruler => {
                    if (!rulersByPower[ruler.faction]) {
                        rulersByPower[ruler.faction] = [];
                    }
                    rulersByPower[ruler.faction].push(ruler);
                });

                // Process each power
                for (const [powerName, rulers] of Object.entries(rulersByPower)) {
                    response += `\n**${powerName}:**\n`;
                    
                    // Get succession paths for ordering
                    const successionPaths = rsm.successionPaths[powerName] || [];
                    const orderedRulers = [];
                    
                    // Start with current ruler
                    const currentRuler = rulers.find(r => r.isCurrentRuler);
                    if (currentRuler) {
                        orderedRulers.push(currentRuler);
                        
                        // Follow succession paths to order the rest
                        let lastRuler = currentRuler;
                        while (true) {
                            const nextPath = successionPaths.find(path => path[0] === lastRuler.name);
                            if (!nextPath) break;
                            
                            const nextRuler = rulers.find(r => r.name === nextPath[1]);
                            if (!nextRuler || orderedRulers.includes(nextRuler)) break;
                            
                            orderedRulers.push(nextRuler);
                            lastRuler = nextRuler;
                        }
                        
                        // Add any remaining rulers that aren't in the succession path
                        rulers.forEach(ruler => {
                            if (!orderedRulers.includes(ruler)) {
                                orderedRulers.push(ruler);
                            }
                        });
                    } else {
                        // If no current ruler, just use all rulers
                        orderedRulers.push(...rulers);
                    }

                    // Display rulers in order
                    orderedRulers.forEach(ruler => {
                        const status = [];
                        if (ruler.isCurrentRuler) status.push('Current');
                        if (ruler.excommunicated) status.push('Excommunicated');
                        
                        response += `${ruler.name}` + 
                            (status.length > 0 ? ` (${status.join(', ')})` : '') +
                            `\n  Battle Rating: ${ruler.battleRating}, Command Rating: ${ruler.commandRating}, Admin Rating: ${ruler.adminRating}` +
                            (ruler.cardBonus ? `, Card Bonus: ${ruler.cardBonus}` : '') +
                            (ruler.otherinfo ? `\n  Special: ${ruler.otherinfo}` : '') +
                            '\n';
                    });
                }
            }

            await interaction.editReply(response);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to list rulers: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
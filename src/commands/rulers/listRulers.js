const { SlashCommandBuilder } = require('discord.js');
const { POWERS } = require('../../game/gameState');
const rulerManager = require('../../game/rulerManager');

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
        
        try {
            let response = '';
            
            if (power) {
                // Get rulers for specific power
                const rulers = await rulerManager.getRulersByPower(power);
                if (!rulers || rulers.length === 0) {
                    await interaction.editReply(`No rulers found for ${power}`);
                    return;
                }

                response = `**Rulers of ${power}:**\n`;
                rulers.forEach(ruler => {
                    const status = [];
                    if (ruler.isCurrentRuler) status.push('Current');
                    if (ruler.excommunicated) status.push('Excommunicated');
                    
                    response += `${ruler.name}` + 
                        (status.length > 0 ? ` (${status.join(', ')})` : '') +
                        `\n  Battle: ${ruler.battleRating}, Command: ${ruler.commandRating}\n`;
                });
            } else {
                // Get all rulers grouped by power
                const allRulers = await rulerManager.getAllRulers();
                const rulersByPower = {};
                
                allRulers.forEach(ruler => {
                    if (!rulersByPower[ruler.power]) {
                        rulersByPower[ruler.power] = [];
                    }
                    rulersByPower[ruler.power].push(ruler);
                });

                for (const [powerName, rulers] of Object.entries(rulersByPower)) {
                    response += `\n**${powerName}:**\n`;
                    rulers.forEach(ruler => {
                        const status = [];
                        if (ruler.isCurrentRuler) status.push('Current');
                        if (ruler.excommunicated) status.push('Excommunicated');
                        
                        response += `${ruler.name}` + 
                            (status.length > 0 ? ` (${status.join(', ')})` : '') +
                            `\n  Battle: ${ruler.battleRating}, Command: ${ruler.commandRating}\n`;
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
const { SlashCommandBuilder } = require('discord.js');
const { POWERS } = require('../../game/gameState');
const spaceManager = require('../../game/spaceManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list_controlled')
        .setDescription('List all spaces controlled by a power')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('Power to list controlled spaces for')
                .setRequired(true)
                .addChoices(...Object.values(POWERS).map(power => ({
                    name: power,
                    value: power
                })))),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const power = interaction.options.getString('power');
        const channelName = interaction.channel.name;
        
        try {
            // Get space manager for this game
            const sm = spaceManager(channelName);

            // Get all spaces controlled by the power
            const spaces = await sm.getControlledSpaces(power);
            
            if (!spaces || spaces.length === 0) {
                await interaction.editReply(`${power} does not control any spaces`);
                return;
            }

            // Group spaces by type
            const spacesByType = {};
            spaces.forEach(space => {
                if (!spacesByType[space.type]) {
                    spacesByType[space.type] = [];
                }
                spacesByType[space.type].push(space);
            });

            // Format response
            let response = `**Spaces controlled by ${power}:**\n`;
            
            for (const [type, typeSpaces] of Object.entries(spacesByType)) {
                response += `\n**${type}s:**\n`;
                typeSpaces.forEach(space => {
                    response += `${space.name}`;
                    
                    // Add space attributes
                    const attributes = [];
                    if (space.isKey) attributes.push('Key');
                    if (space.isCapital) attributes.push('Capital');
                    if (space.fortress) attributes.push('Fortress');
                    if (space.hasPorts) attributes.push('Port');
                    
                    // Add control status
                    if (space.controllingPower === null) {
                        attributes.push('Home space');
                    } else if (space.homePower !== power) {
                        attributes.push(`Home: ${space.homePower}`);
                    }
                    
                    // Add religious status
                    if (space.catholic !== undefined) {
                        attributes.push(space.catholic ? 'Catholic' : 'Protestant');
                        if (space.catholic && space.jesuiteUniversity) {
                            attributes.push('Jesuite University');
                        }
                    }
                    
                    // Add all attributes in parentheses if any exist
                    if (attributes.length > 0) {
                        response += ` (${attributes.join(', ')})`;
                    }
                    
                    response += '\n';
                });
            }

            await interaction.editReply(response);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to list controlled spaces: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
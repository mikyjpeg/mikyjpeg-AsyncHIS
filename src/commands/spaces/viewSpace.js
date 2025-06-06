const { SlashCommandBuilder } = require('discord.js');
const spaceManager = require('../../game/spaceManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('view_space')
        .setDescription('View details of a space')
        .addStringOption(option =>
            option.setName('space')
                .setDescription('Name of the space to view')
                .setRequired(true)),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const spaceName = interaction.options.getString('space');
        const channelName = interaction.channel.name;
        
        try {
            // Get space manager for this game
            const sm = spaceManager(channelName);

            const space = await sm.getSpace(spaceName);
            if (!space) {
                await interaction.editReply(`Space ${spaceName} not found`);
                return;
            }

            // Format basic info
            let details = `**${space.name}** (${space.type})\n` +
                         `Home Power: ${space.homePower}\n` +
                         `Controlling Power: ${space.controllingPower || space.homePower}\n` +
                         `Religion: ${space.catholic ? 'Catholic' : 'Protestant'}\n`;

            // Format formations if any
            if (space.formations && space.formations.length > 0) {
                details += '\n**Formations:**\n';
                space.formations.forEach(formation => {
                    const troopInfo = formation.power === 'Ottoman' ?
                        `${formation.regulars} regulars, ${formation.cavalry} cavalry` :
                        `${formation.regulars} regulars, ${formation.mercenaries} mercenaries`;
                    const leaderInfo = formation.leaders.length > 0 ? 
                        `\n  Leaders: ${formation.leaders.join(', ')}` : '';
                    details += `${formation.power}: ${troopInfo}${leaderInfo}\n`;
                });
            }

            // Add reformer info for Protestant spaces
            if (!space.catholic && space.reformers && space.reformers.length > 0) {
                details += `\n**Reformers:** ${space.reformers.join(', ')}`;
            }

            // Add Jesuite university info for Catholic spaces
            if (space.catholic && space.jesuiteUniversity) {
                details += '\n**Has Jesuite University**';
            }

            await interaction.editReply(details);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to view space: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
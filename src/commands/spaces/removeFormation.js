const { SlashCommandBuilder } = require('discord.js');
const formationManager = require('../../game/formationManager');
const spaceManager = require('../../game/spaceManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const { POWERS } = require('../../game/gameState');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove_formation')
        .setDescription('Remove troops and/or leaders from a formation')
        .addStringOption(option =>
            option.setName('space')
                .setDescription('The space to remove from')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power that controls the formation')
                .setRequired(true)
                .addChoices(...Object.values(POWERS).map(power => ({
                    name: power,
                    value: power
                }))))
        .addIntegerOption(option =>
            option.setName('regulars')
                .setDescription('Number of regular troops to remove')
                .setRequired(true)
                .setMinValue(0))
        .addIntegerOption(option =>
            option.setName('secondary')
                .setDescription('Number of mercenaries/cavalry to remove')
                .setRequired(true)
                .setMinValue(0))
        .addStringOption(option =>
            option.setName('leaders')
                .setDescription('Leaders to remove (comma-separated)')
                .setRequired(false)),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const spaceName = interaction.options.getString('space');
        const power = interaction.options.getString('power');
        const regularTroops = interaction.options.getInteger('regulars');
        const secondaryTroops = interaction.options.getInteger('secondary');
        const leadersInput = interaction.options.getString('leaders');
        const leaders = leadersInput ? leadersInput.split(',').map(l => l.trim()) : [];
        
        try {
            // Get the channel name
            const channelName = interaction.channel.name;

            // Get the managers for this game
            const fm = formationManager(channelName);
            const sm = spaceManager(channelName);

            // Get current state before changes
            const oldState = await sm.getSpace(spaceName);

            // Remove from formation
            const updatedSpace = await fm.removeFormation(spaceName, power, regularTroops, secondaryTroops, leaders);
            
            // Record in history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.REMOVE_FORMATION,
                {
                    spaceName,
                    power,
                    oldState,
                    newState: updatedSpace,
                    removed: {
                        regularTroops,
                        secondaryTroops,
                        leaders
                    }
                }
            );

            // Check if the formation still exists
            const remainingFormation = updatedSpace.formations.find(f => f.power === power);
            let statusMessage;
            
            if (remainingFormation) {
                const troopInfo = power === 'Ottoman' ?
                    `${remainingFormation.regulars} regulars and ${remainingFormation.cavalry} cavalry remaining` :
                    `${remainingFormation.regulars} regulars and ${remainingFormation.mercenaries} mercenaries remaining`;
                const leaderInfo = remainingFormation.leaders.length > 0 ? 
                    `\nRemaining leaders: ${remainingFormation.leaders.join(', ')}` : '';
                statusMessage = `${remainingFormation.power}: ${troopInfo}${leaderInfo}`;
            } else {
                statusMessage = `${power} formation completely removed`;
            }

            await interaction.editReply(
                `Removed from ${spaceName} (Command ID: ${historyEntry.commandId}):\n` +
                `${power === 'Ottoman' ? 
                    `${regularTroops} regulars and ${secondaryTroops} cavalry` :
                    `${regularTroops} regulars and ${secondaryTroops} mercenaries`}` +
                `${leaders.length > 0 ? ` and leaders: ${leaders.join(', ')}` : ''}\n` +
                statusMessage
            );
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to remove formation: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
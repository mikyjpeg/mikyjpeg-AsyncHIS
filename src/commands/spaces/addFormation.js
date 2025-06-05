const { SlashCommandBuilder } = require('discord.js');
const formationManager = require('../../game/formationManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const { POWERS } = require('../../game/gameState');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add_formation')
        .setDescription('Add a formation to a space')
        .addStringOption(option =>
            option.setName('space')
                .setDescription('The space to add the formation to')
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
                .setDescription('Number of regular troops')
                .setRequired(true)
                .setMinValue(0))
        .addIntegerOption(option =>
            option.setName('secondary')
                .setDescription('Number of mercenaries (or cavalry for Ottoman)')
                .setRequired(true)
                .setMinValue(0))
        .addStringOption(option =>
            option.setName('leaders')
                .setDescription('Leaders to add (comma-separated)')
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
            // Get the channel name instead of ID
            const channelName = interaction.channel.name;
            
            // Add the formation
            const updatedSpace = await formationManager(channelName).addFormation(spaceName, power, regularTroops, secondaryTroops, leaders);
            
            // Record in history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.ADD_FORMATION,
                {
                    spaceName,
                    formation: {
                        power,
                        regularTroops,
                        secondaryTroops,
                        leaders
                    }
                }
            );

            // Format the formation details for display
            const formation = updatedSpace.formations.find(f => f.power === power);
            const troopInfo = power === 'Ottoman' ?
                `${formation.regulars} regulars and ${formation.cavalry} cavalry` :
                `${formation.regulars} regulars and ${formation.mercenaries} mercenaries`;
            const leaderInfo = formation.leaders.length > 0 ? ` with leaders: ${formation.leaders.join(', ')}` : '';
            
            await interaction.editReply(
                `Added formation to ${spaceName} (Command ID: ${historyEntry.commandId}):\n` +
                `${formation.power}: ${troopInfo}${leaderInfo}`
            );
        } catch (error) {
            // Record error in history with channel name
            const channelName = interaction.channel.name;
            await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.ADD_FORMATION,
                {
                    spaceName,
                    formation: {
                        power,
                        regularTroops,
                        secondaryTroops,
                        leaders
                    }
                },
                false,
                error.message
            );
            
            await interaction.editReply({ 
                content: `Failed to add formation: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
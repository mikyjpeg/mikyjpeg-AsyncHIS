const { SlashCommandBuilder } = require('discord.js');
const spaceManager = require('../../game/spaceManager');
const { POWERS } = require('../../game/gameState');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('control')
        .setDescription('Change control of a space')
        .addStringOption(option =>
            option.setName('space')
                .setDescription('The space to change control of')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power to take control')
                .setRequired(true)
                .addChoices(...Object.values(POWERS).map(power => ({
                    name: power,
                    value: power
                })))),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const spaceName = interaction.options.getString('space');
        const power = interaction.options.getString('power');
        
        try {
            // Get the channel name
            const channelName = interaction.channel.name;

            // Get the space manager for this game
            const sm = spaceManager(channelName);

            // Get space data
            const space = await sm.getSpace(spaceName);
            if (!space) {
                await interaction.editReply(`Space ${spaceName} not found`);
                return;
            }

            // Store previous controller for history
            const previousController = space.controllingPower;

            // Update control
            space.controllingPower = power;
            await sm.updateSpace(spaceName, space);
            
            // Record in history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.TAKE_CONTROL,
                {
                    spaceName,
                    power,
                    previousController,
                    homePower: space.homePower // Store homePower for better undo messages
                }
            );

            // Use homePower as fallback when displaying previous controller
            const displayPreviousController = previousController || space.homePower;
            await interaction.editReply(`${power} has taken control of ${spaceName} from ${displayPreviousController} (Command ID: ${historyEntry.commandId})`);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to change control: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
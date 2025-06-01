const { SlashCommandBuilder } = require('discord.js');
const spaceManager = require('../../game/spaceManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('convert')
        .setDescription('Convert a space to Catholicism or Protestantism')
        .addStringOption(option =>
            option.setName('space')
                .setDescription('The space to convert')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('religion')
                .setDescription('The religion to convert to')
                .setRequired(true)
                .addChoices(
                    { name: 'Catholic', value: 'catholic' },
                    { name: 'Protestant', value: 'protestant' }
                )),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const spaceName = interaction.options.getString('space');
        const religion = interaction.options.getString('religion');
        
        try {
            // Get the space data
            const space = await spaceManager.getSpace(spaceName);
            
            // Check if space can be converted (not Ottoman or Mixed)
            if (space.homePower === 'Ottoman' || space.homePower === 'Mixed') {
                await interaction.editReply(`${spaceName} cannot be converted as it is ${space.homePower} territory`);
                return;
            }

            const converting = religion === 'catholic';
            
            // Check if already that religion
            if (space.catholic === converting) {
                await interaction.editReply(`${spaceName} is already ${converting ? 'Catholic' : 'Protestant'}`);
                return;
            }

            // Store previous state for history
            const previousState = {
                name: spaceName,
                catholic: space.catholic,
                reformer: space.reformer,
                jesuiteUniversity: space.jesuiteUniversity
            };

            // Convert the space
            space.catholic = converting;
            
            // If converting to Protestant, remove any Jesuite university
            if (!converting && space.jesuiteUniversity) {
                space.jesuiteUniversity = false;
            }

            await spaceManager.updateSpace(spaceName, space);
            
            // Record in history
            const historyEntry = await commandHistory.recordSlashCommand(
                interaction,
                COMMAND_TYPES.CONVERT_SPACE,
                {
                    space: previousState,
                    oldReligion: previousState.catholic ? 'Catholic' : 'Protestant',
                    newReligion: converting ? 'Catholic' : 'Protestant',
                    removedJesuiteUniversity: !converting && previousState.jesuiteUniversity
                }
            );

            let responseText = `Converted ${spaceName} to ${converting ? 'Catholicism' : 'Protestantism'} (Command ID: ${historyEntry.commandId})`;
            if (!converting && previousState.jesuiteUniversity) {
                responseText += ' and removed its Jesuite university';
            }

            await interaction.editReply(responseText);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to convert space: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
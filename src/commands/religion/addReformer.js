const { SlashCommandBuilder } = require('discord.js');
const reformerManager = require('../../game/reformerManager');
const spaceManager = require('../../game/spaceManager');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add_reformer')
        .setDescription('Add a reformer to their designated space')
        .addStringOption(option =>
            option.setName('reformer')
                .setDescription('Name of the reformer')
                .setRequired(true)),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const reformerName = interaction.options.getString('reformer');
        const channelName = interaction.channel.name;
        
        try {
            // Get managers for this game
            const rm = reformerManager(channelName);
            const sm = spaceManager(channelName);

            // Get current states
            const oldReformerState = await rm.getReformer(reformerName);
            
            // Add reformer to their designated space
            const { reformer: newReformerState, space: newSpaceState } = await rm.addReformerToSpace(reformerName);
            
            // Get the old space state
            const oldSpaceState = await sm.getSpace(newSpaceState.name);
            
            // Record in history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.ADD_REFORMER,
                {
                    reformerName,
                    spaceName: newSpaceState.name,
                    oldReformerState,
                    newReformerState,
                    oldSpaceState,
                    newSpaceState
                }
            );

            await interaction.editReply(`Added ${reformerName} to ${newSpaceState.name} (Command ID: ${historyEntry.commandId})`);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to add reformer: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
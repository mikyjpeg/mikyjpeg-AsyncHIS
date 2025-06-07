const { SlashCommandBuilder } = require('discord.js');
const { commandHistory } = require('../../game/commandHistoryManager');
const { actionUndo } = require('../../game/actionUndoManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('undo')
        .setDescription('Undo the last command')
        .addIntegerOption(option =>
            option.setName('command_id')
                .setDescription('ID of the command to undo (defaults to last command)')
                .setRequired(false)),

    async execute(interaction) {
        try {
            const channelName = interaction.channel.name;
            const commandId = interaction.options.getInteger('command_id');
            const ch = commandHistory(channelName);

            // Get the command to undo
            const command = commandId ? await ch.getCommand(commandId) : await ch.getLastCommand();

            // Try to undo using actionUndo manager
            const au = actionUndo(channelName);
            await au.undoAction(command);

            // Mark the command as undone
            await ch.markCommandAsUndone(command.commandId);

            await interaction.reply({
                content: `Successfully undone command ${command.commandId}: ${command.command}`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in undo command:', error);
            await interaction.reply({
                content: error.message || 'There was an error undoing the command!',
                ephemeral: true
            });
        }
    }
}; 
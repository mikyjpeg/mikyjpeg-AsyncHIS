const { SlashCommandBuilder } = require('discord.js');
const { commandHistory } = require('../../game/commandHistoryManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription('View command history')
        .addIntegerOption(option =>
            option.setName('limit')
                .setDescription('Number of commands to show')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(50))
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Page number to view (1 is most recent)')
                .setRequired(false)
                .setMinValue(1)),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            const limit = interaction.options.getInteger('limit') || 20; // Default to 20 entries
            const requestedPage = interaction.options.getInteger('page') || 1;
            const channelName = interaction.channel.name;
            
            // Get command history manager for this game
            const history = await commandHistory(channelName).getCommandHistory(limit);

            if (history.length === 0) {
                await interaction.editReply('No commands in history');
                return;
            }

            // Format each history entry
            const formattedEntries = history.map(entry => {
                const date = new Date(entry.timestamp).toLocaleString();
                const status = entry.undone ? '❌ UNDONE' : (entry.success ? '✅ SUCCESS' : '⚠️ ERROR');
                const error = entry.errorMessage ? `\n    Error: ${entry.errorMessage}` : '';
                
                return `[${entry.commandId}] ${date} - ${entry.username}\n` +
                       `    Command: ${entry.command}\n` +
                       `    Type: ${entry.type}\n` +
                       `    Status: ${status}${error}`;
            });

            // Reverse the entries to show most recent first
            formattedEntries.reverse();

            // Calculate pagination
            const ENTRIES_PER_PAGE = 5;
            const totalPages = Math.ceil(formattedEntries.length / ENTRIES_PER_PAGE);
            const page = Math.min(requestedPage, totalPages);
            const startIdx = (page - 1) * ENTRIES_PER_PAGE;
            const endIdx = Math.min(startIdx + ENTRIES_PER_PAGE, formattedEntries.length);

            // Get entries for current page
            const pageEntries = formattedEntries.slice(startIdx, endIdx);

            // Calculate the actual entry numbers (in reverse)
            const totalEntries = formattedEntries.length;
            const showingStart = totalEntries - endIdx + 1;
            const showingEnd = totalEntries - startIdx;

            // Create the response
            const response = [
                `Command History (Page ${page}/${totalPages}):`,
                '',
                ...pageEntries,
                '',
                `Showing entries ${showingStart}-${showingEnd} of ${totalEntries}`
            ];

            // Add navigation hint if appropriate
            if (page < totalPages) {
                response.push(`Use /history page:${page + 1} to see older entries`);
            }
            if (page > 1) {
                response.push(`Use /history page:${page - 1} to see more recent entries`);
            }

            await interaction.editReply(response.join('\n'));
        } catch (error) {
            console.error('Error in history command:', error);
            await interaction.editReply({ 
                content: `Failed to retrieve command history: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
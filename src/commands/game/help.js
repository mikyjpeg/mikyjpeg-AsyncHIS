const { SlashCommandBuilder } = require('discord.js');
const commandHandler = require('../../commands/commandHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show list of available commands')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Command category to show')
                .setRequired(false)
                .addChoices(
                    { name: 'All Commands', value: 'all' },
                    { name: 'Game Management', value: 'game' },
                    { name: 'Diplomacy', value: 'diplomacy' },
                    { name: 'Spaces & Control', value: 'spaces' },
                    { name: 'Religion', value: 'religion' },
                    { name: 'Rulers & Leaders', value: 'rulers' },
                    { name: 'Cards & Impulses', value: 'cards' },
                    { name: 'Actions', value: 'actions' },
                    { name: 'Naval Operations', value: 'naval' }
                )),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            const selectedCategory = interaction.options.getString('category') || 'all';
            const commandsByCategory = commandHandler.getCommandsByCategory();
            let messages = [];
            
            if (selectedCategory === 'all') {
                // Show a summary of all categories with command count
                let summaryMessage = '**Here I Stand Bot Commands**\n\n';
                summaryMessage += 'Use `/help category:category_name` to see detailed commands for each category.\n\n';
                
                for (const category of Object.keys(commandsByCategory)) {
                    const commandCount = commandsByCategory[category].length;
                    const categoryName = this.getCategoryDisplayName(category);
                    summaryMessage += `**${categoryName}** - ${commandCount} command${commandCount !== 1 ? 's' : ''}\n`;
                }
                
                messages.push(summaryMessage);
            } else {
                // Show detailed commands for the selected category
                const commands = commandsByCategory[selectedCategory] || [];
                if (commands.length === 0) {
                    messages.push(`No commands found for category: ${selectedCategory}`);
                } else {
                    const categoryName = this.getCategoryDisplayName(selectedCategory);
                    let categoryMessage = `**${categoryName} Commands**\n\n`;
                    categoryMessage += commands.map(cmd => cmd).join('\n');
                    messages.push(categoryMessage);
                }
            }
            
            // Send first message as reply
            await interaction.editReply(messages[0]);
            
            // Send follow-up messages if any
            for (let i = 1; i < messages.length; i++) {
                await interaction.followUp(messages[i]);
            }
        } catch (error) {
            console.error('Error in help command:', error);
            await interaction.editReply({ 
                content: `Failed to get command list: ${error.message}`,
                ephemeral: true 
            });
        }
    },

    getCategoryDisplayName(category) {
        const displayNames = {
            'game': 'Game Management',
            'diplomacy': 'Diplomacy',
            'spaces': 'Spaces & Control',
            'religion': 'Religion',
            'rulers': 'Rulers & Leaders',
            'cards': 'Cards & Impulses',
            'actions': 'Actions',
            'naval': 'Naval Operations'
        };
        return displayNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
    }
}; 
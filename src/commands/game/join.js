const { SlashCommandBuilder } = require('discord.js');
const { GameState, POWERS } = require('../../game/gameState');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Join the game as a power')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power you want to play as')
                .setRequired(true)
                .addChoices(
                    ...Object.values(POWERS).map(power => ({
                        name: power,
                        value: power
                    }))
                )),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        const powerName = interaction.options.getString('power');
        console.log(`User ${interaction.user.username} attempting to join as ${powerName}`);
        
        try {
            await GameState.assignPower(interaction.user.id, interaction.user.username, powerName);
            console.log(`Successfully assigned ${powerName} to ${interaction.user.username}`);
            
            await interaction.editReply(`Successfully assigned ${powerName} to ${interaction.user.username}`);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to join as ${powerName}: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
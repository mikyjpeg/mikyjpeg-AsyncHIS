const { SlashCommandBuilder } = require('discord.js');
const { GameState, POWERS } = require('../../game/gameState');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Give up control of a power')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power you want to give up')
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
        console.log(`User ${interaction.user.username} attempting to leave ${powerName}`);
        
        try {
            await GameState.leavePower(interaction.user.id, powerName);
            console.log(`Successfully removed ${interaction.user.username} from ${powerName}`);
            
            await interaction.editReply(`Successfully removed ${interaction.user.username} from ${powerName}`);
        } catch (error) {
            await interaction.editReply({ 
                content: `Failed to leave ${powerName}: ${error.message}`,
                ephemeral: true 
            });
        }
    }
}; 
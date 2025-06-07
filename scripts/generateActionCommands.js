const fs = require('fs').promises;
const path = require('path');

const TEMPLATE = `const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const actionsManager = require('../../game/actionsManager');
const factionManager = require('../../game/factionManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ACTION_NAME')
        .setDescription('ACTION_DESCRIPTION')
        .addStringOption(option =>
            option.setName('power')
                .setDescription('The power performing the action')
                .setRequired(true)
                .addChoices(POWER_CHOICES))
        ADDITIONAL_OPTIONS,

    async execute(interaction) {
        try {
            const power = interaction.options.getString('power');
            PARAM_DECLARATIONS
            const channelName = interaction.channel.name;

            // Get actions manager for this game
            const am = actionsManager(channelName);

            // Validate the action exists and can be performed by this power
            await am.validateAction('ACTION_ID', power);

            // Get the action cost
            const cost = await am.getActionCost('ACTION_ID', power);

            // Record in command history
            const historyEntry = await commandHistory(channelName).recordSlashCommand(
                interaction,
                COMMAND_TYPES.ACTION_UPPER_ID,
                {
                    actionId: 'ACTION_ID',
                    power,
                    PARAM_HISTORY
                    cost
                }
            );

            // For now, just acknowledge the command
            await interaction.reply({
                content: \`Action: ACTION_NAME\\nPower: \${power}\\nPARAM_DISPLAY(Cost: \${cost})\\n(Command ID: \${historyEntry.commandId})\`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in ACTION_NAME command:', error);
            await interaction.reply({
                content: error.message || 'There was an error executing the action!',
                ephemeral: true
            });
        }
    }
};`;

async function generateActionCommand(actionFile, actionData) {
    const actionId = path.basename(actionFile, '.json');
    const commandName = actionId.replace(/_/g, '_');
    const actionTypeId = 'ACTION_' + actionId.toUpperCase();
    
    // Get powers that can perform this action
    const validPowers = Object.entries(actionData.factions)
        .filter(([_, data]) => data.canPerform)
        .map(([power, _]) => `                    { name: '${power}', value: '${power}' }`);

    // Generate additional options based on the action
    const additionalOptions = [];
    
    // Common options for movement actions
    if (actionId.includes('move_formation')) {
        additionalOptions.push(`
        .addStringOption(option =>
            option.setName('from_space')
                .setDescription('Starting space of the movement')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('to_space')
                .setDescription('Destination space of the movement')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('formation_id')
                .setDescription('ID of the formation to move')
                .setRequired(true))`);
    }

    // Options for actions that require CP
    if (actionId.includes('build_') || actionId.includes('raise_')) {
        additionalOptions.push(`
        .addIntegerOption(option =>
            option.setName('cp_spent')
                .setDescription('Number of CP to spend')
                .setRequired(true)
                .setMinValue(1))`);
    }

    // Special options for specific actions
    if (actionId === 'publish_treatise') {
        additionalOptions.push(`
        .addStringOption(option =>
            option.setName('language_zone')
                .setDescription('Language zone to publish in')
                .setRequired(true)
                .addChoices(
                    { name: 'English', value: 'english' },
                    { name: 'German', value: 'german' },
                    { name: 'French', value: 'french' }
                ))`);
    }

    // Generate parameter declarations and history entries
    let paramDeclarations = '';
    let paramHistory = '';
    let paramDisplay = '';

    if (actionId.includes('move_formation')) {
        paramDeclarations = `
            const fromSpace = interaction.options.getString('from_space');
            const toSpace = interaction.options.getString('to_space');
            const formationId = interaction.options.getString('formation_id');`;
        paramHistory = `
                    fromSpace,
                    toSpace,
                    formationId,`;
        paramDisplay = `\\nFrom: \${fromSpace}\\nTo: \${toSpace}\\nFormation: \${formationId}\\n`;
    }

    if (actionId.includes('build_') || actionId.includes('raise_')) {
        paramDeclarations = `
            const cpSpent = interaction.options.getInteger('cp_spent');`;
        paramHistory = `
                    cpSpent,`;
        paramDisplay = `\\nCP Spent: \${cpSpent}\\n`;
    }

    if (actionId === 'publish_treatise') {
        paramDeclarations = `
            const languageZone = interaction.options.getString('language_zone');`;
        paramHistory = `
                    languageZone,`;
        paramDisplay = `\\nLanguage Zone: \${languageZone}\\n`;
    }

    // Create the command content
    const commandContent = TEMPLATE
        .replace(/ACTION_NAME/g, commandName)
        .replace(/ACTION_DESCRIPTION/g, actionData.description)
        .replace(/ACTION_ID/g, actionId)
        .replace(/ACTION_UPPER_ID/g, actionTypeId)
        .replace(/POWER_CHOICES/g, validPowers.join(',\n'))
        .replace(/ADDITIONAL_OPTIONS/g, additionalOptions.join(''))
        .replace(/PARAM_DECLARATIONS/g, paramDeclarations)
        .replace(/PARAM_HISTORY/g, paramHistory)
        .replace(/PARAM_DISPLAY/g, paramDisplay);

    // Write the command file
    const commandPath = path.join(process.cwd(), 'src', 'commands', 'actions', `${commandName}.js`);
    await fs.writeFile(commandPath, commandContent);
    console.log(`Generated command: ${commandName}`);
}

async function generateAllCommands() {
    try {
        const actionsDir = path.join(process.cwd(), 'data', 'game_template', 'actions');
        const files = await fs.readdir(actionsDir);

        for (const file of files) {
            if (!file.endsWith('.json')) continue;

            const content = await fs.readFile(path.join(actionsDir, file), 'utf8');
            const actionData = JSON.parse(content);
            await generateActionCommand(file, actionData);
        }

        console.log('All action commands generated successfully!');
    } catch (error) {
        console.error('Error generating commands:', error);
    }
}

generateAllCommands(); 
const { SlashCommandBuilder } = require('discord.js');
const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const rulerManager = require('../../game/rulerManager');
const rulerSuccessionManager = require('../../game/rulerSuccessionManager');
const spaceManager = require('../../game/spaceManager');
const diplomacyManager = require('../../game/diplomacyManager');
const victoryPointsManager = require('../../game/victoryPointsManager');
const reformerManager = require('../../game/reformerManager');
const electorateManager = require('../../game/electorateManager');
const formationManager = require('../../game/formationManager');
const path = require('path');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('undo')
        .setDescription('Undo a command')
        .addIntegerOption(option =>
            option.setName('command_id')
                .setDescription('ID of the command to undo (leave empty to undo last command)')
                .setRequired(false)
                .setMinValue(1)),
        
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            // Get the channel name
            const channelName = interaction.channel.name;
            
            // Get the command to undo
            const commandId = interaction.options.getInteger('command_id');
            const commandToUndo = commandId
                ? await commandHistory(channelName).getCommand(commandId)
                : await commandHistory(channelName).getLastCommand();

            let undoMessage = '';

            switch (commandToUndo.type) {
                case COMMAND_TYPES.EXCOMMUNICATION: {
                    if (commandToUndo.data.ruler) {
                        const { ruler } = commandToUndo.data;
                        
                        // Get the ruler and faction data
                        const rulerData = await rulerManager(channelName).getRuler(ruler.name);
                        const faction = await diplomacyManager(channelName).getFaction(ruler.faction);
                        
                        // Update ruler's excommunication status
                        rulerData.excommunicated = false;
                        await rulerManager(channelName).updateRuler(ruler.name, rulerData);
                        
                        // Restore faction's card modifier
                        faction.cardModifier = (faction.cardModifier || 0) + 1;
                        await diplomacyManager(channelName).updateFaction(ruler.faction, faction);
                        
                        undoMessage = `Undid excommunication of ${ruler.name}\nCard modifier for ${ruler.faction}: +1 (now ${faction.cardModifier})`;
                    } else {
                        const { reformer } = commandToUndo.data;
                        
                        // Get the reformer data
                        const reformerData = await reformerManager(channelName).getReformer(reformer.name);
                        
                        // Update reformer's excommunication status
                        reformerData.isExcommunicated = false;
                        await reformerManager(channelName).updateReformer(reformer.name, reformerData);
                        
                        undoMessage = `Undid excommunication of reformer ${reformer.name}`;
                    }
                    break;
                }
                
                case COMMAND_TYPES.REMOVE_EXCOMMUNICATION: {
                    if (commandToUndo.data.ruler) {
                        const { ruler } = commandToUndo.data;
                        
                        // Get the ruler and faction data
                        const rulerData = await rulerManager(channelName).getRuler(ruler.name);
                        const faction = await diplomacyManager(channelName).getFaction(ruler.faction);
                        
                        // Update ruler's excommunication status
                        rulerData.excommunicated = true;
                        await rulerManager(channelName).updateRuler(ruler.name, rulerData);
                        
                        // Restore faction's card modifier
                        faction.cardModifier = (faction.cardModifier || 0) - 1;
                        await diplomacyManager(channelName).updateFaction(ruler.faction, faction);
                        
                        undoMessage = `Undid removal of excommunication for ${ruler.name}\nCard modifier for ${ruler.faction}: -1 (now ${faction.cardModifier})`;
                    } else {
                        const { reformer } = commandToUndo.data;
                        
                        // Get the reformer data
                        const reformerData = await reformerManager(channelName).getReformer(reformer.name);
                        
                        // Update reformer's excommunication status
                        reformerData.isExcommunicated = true;
                        await reformerManager(channelName).updateReformer(reformer.name, reformerData);
                        
                        undoMessage = `Undid removal of excommunication for reformer ${reformer.name}`;
                    }
                    break;
                }
                
                case COMMAND_TYPES.RULER_CHANGE: {
                    const { oldRuler, newRuler } = commandToUndo.data;
                    
                    // Restore old ruler as current
                    oldRuler.isCurrentRuler = true;
                    await rulerManager(channelName).updateRuler(oldRuler.name, oldRuler);
                    
                    // Remove current status from new ruler
                    newRuler.isCurrentRuler = false;
                    await rulerManager(channelName).updateRuler(newRuler.name, newRuler);
                    
                    undoMessage = `Undid ruler change: ${newRuler.name} -> ${oldRuler.name}`;
                    break;
                }

                case COMMAND_TYPES.CONVERT_SPACE: {
                    const { space, oldReligion } = commandToUndo.data;
                    const spaceData = await spaceManager(channelName).getSpace(space.name);
                    
                    // Restore previous state
                    spaceData.catholic = space.catholic;
                    spaceData.reformer = space.reformer;
                    spaceData.jesuiteUniversity = space.jesuiteUniversity;
                    
                    await spaceManager(channelName).updateSpace(space.name, spaceData);
                    
                    let message = `Undid conversion of ${space.name} (restored to ${oldReligion})`;
                    if (space.jesuiteUniversity) {
                        message += ' and restored its Jesuite university';
                    }
                    undoMessage = message;
                    break;
                }

                case COMMAND_TYPES.TAKE_CONTROL: {
                    const { spaceName, power, previousController, homePower } = commandToUndo.data;
                    const spaceData = await spaceManager(channelName).getSpace(spaceName);
                    
                    // Restore previous controller
                    spaceData.controllingPower = previousController;
                    await spaceManager(channelName).updateSpace(spaceName, spaceData);
                    
                    // Use homePower as fallback when displaying previous controller
                    const displayPreviousController = previousController || homePower;
                    undoMessage = `Undid control change of ${spaceName} (restored control to ${displayPreviousController} from ${power})`;
                    break;
                }

                case COMMAND_TYPES.ADD_FORMATION: {
                    const { spaceName, formation } = commandToUndo.data;
                    const spaceData = await spaceManager(channelName).getSpace(spaceName);
                    
                    // Remove the formation
                    spaceData.formations = spaceData.formations.filter(f => f.power !== formation.power);
                    await spaceManager(channelName).updateSpace(spaceName, spaceData);
                    
                    // Format the formation details for display
                    const troopInfo = formation.power === 'Ottoman' ?
                        `${formation.regularTroops} regulars and ${formation.secondaryTroops} cavalry` :
                        `${formation.regularTroops} regulars and ${formation.secondaryTroops} mercenaries`;
                    const leaderInfo = formation.leaders.length > 0 ? ` with leaders: ${formation.leaders.join(', ')}` : '';
                    
                    undoMessage = `Removed formation from ${spaceName}:\n${formation.power}: ${troopInfo}${leaderInfo}`;
                    break;
                }

                case COMMAND_TYPES.ADD_JESUITE: {
                    const { spaceName } = commandToUndo.data;
                    const spaceData = await spaceManager(channelName).getSpace(spaceName);
                    
                    // Remove the Jesuite university
                    spaceData.jesuiteUniversity = false;
                    await spaceManager(channelName).updateSpace(spaceName, spaceData);
                    
                    undoMessage = `Removed Jesuite university from ${spaceName}`;
                    break;
                }

                case COMMAND_TYPES.ADD_VP: {
                    const { power, amount } = commandToUndo.data;
                    const faction = await factionManager(channelName).getFaction(power);
                    
                    // Store old state
                    const oldState = { ...faction };
                    const oldVP = faction.victoryPoints || 0;

                    // Update VP
                    faction.victoryPoints = oldVP - amount;
                    await factionManager(channelName).updateFaction(power, faction);
                    
                    undoMessage = `Removed ${amount} VP from ${power}. New total: ${faction.victoryPoints} VP`;
                    break;
                }

                case COMMAND_TYPES.REMOVE_VP: {
                    const { power, amount } = commandToUndo.data;
                    const faction = await factionManager(channelName).getFaction(power);
                    
                    // Store old state
                    const oldState = { ...faction };
                    const oldVP = faction.victoryPoints || 0;

                    // Update VP
                    faction.victoryPoints = oldVP + amount;
                    await factionManager(channelName).updateFaction(power, faction);
                    
                    undoMessage = `Added back ${amount} VP to ${power}. New total: ${faction.victoryPoints} VP`;
                    break;
                }

                case COMMAND_TYPES.SET_VP: {
                    const { power, oldState } = commandToUndo.data;
                    await factionManager(channelName).updateFaction(power, oldState);
                    undoMessage = `Restored ${power}'s VP to ${oldState.victoryPoints}`;
                    break;
                }

                case COMMAND_TYPES.DEPLOY_ELECTORATE: {
                    const { electorateName, oldState } = commandToUndo.data;
                    await electorateManager(channelName).updateElectorate(electorateName, oldState);
                    undoMessage = `Undid deployment of electorate ${electorateName}`;
                    break;
                }

                case COMMAND_TYPES.REMOVE_REFORMER: {
                    const { reformerName, oldState } = commandToUndo.data;
                    await reformerManager(channelName).updateReformer(reformerName, oldState);
                    undoMessage = `Restored reformer ${reformerName} to active status`;
                    break;
                }

                case COMMAND_TYPES.SET_RELIGIOUS_INFLUENCE: {
                    const { spaceName, oldState } = commandToUndo.data;
                    await spaceManager(channelName).updateSpace(spaceName, oldState);
                    undoMessage = `Restored religious influence in ${spaceName} to Protestant: ${oldState.protestantInfluence}, Catholic: ${oldState.catholicInfluence}`;
                    break;
                }

                case COMMAND_TYPES.TOGGLE_RELIGIOUS_CONTROL: {
                    const { spaceName, oldState } = commandToUndo.data;
                    await spaceManager(channelName).updateSpace(spaceName, oldState);
                    const religion = oldState.catholic ? 'Catholic' : 'Protestant';
                    undoMessage = `Restored religious control of ${spaceName} to ${religion}`;
                    break;
                }

                case COMMAND_TYPES.REMOVE_JESUITE: {
                    const { spaceName, oldState } = commandToUndo.data;
                    await spaceManager(channelName).updateSpace(spaceName, oldState);
                    undoMessage = `Restored Jesuite university to ${spaceName}`;
                    break;
                }

                case COMMAND_TYPES.SET_CURRENT_DEBATER: {
                    const { oldStates } = commandToUndo.data;
                    for (const { debaterName, oldState } of oldStates) {
                        await debaterManager(channelName).updateDebater(debaterName, oldState);
                    }
                    undoMessage = `Restored previous debater state`;
                    break;
                }

                case COMMAND_TYPES.CLEAR_CURRENT_DEBATER: {
                    const { debaterName, oldState } = commandToUndo.data;
                    await debaterManager(channelName).updateDebater(debaterName, oldState);
                    undoMessage = `Restored ${debaterName} as current debater`;
                    break;
                }

                default:
                    throw new Error(`Unsupported command type for undo: ${commandToUndo.type}`);
            }

            await interaction.editReply(`Undo successful: ${undoMessage}`);
        } catch (error) {
            await interaction.editReply(`Error in undo command: ${error.message}`);
        }
    }
}; 
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
            // Get the command to undo
            const commandId = interaction.options.getInteger('command_id');
            const commandToUndo = commandId
                ? await commandHistory.getCommand(commandId)
                : await commandHistory.getLastCommand();

            let undoMessage = '';

            switch (commandToUndo.type) {
                case COMMAND_TYPES.EXCOMMUNICATION: {
                    if (commandToUndo.data.ruler) {
                        const { ruler } = commandToUndo.data;
                        
                        // Get the ruler and faction data
                        const rulerData = await rulerManager.getRuler(ruler.name);
                        const faction = await diplomacyManager.getFaction(ruler.faction);
                        
                        // Update ruler's excommunication status
                        rulerData.excommunicated = false;
                        await rulerManager.updateRuler(ruler.name, rulerData);
                        
                        // Restore faction's card modifier
                        faction.cardModifier = (faction.cardModifier || 0) + 1;
                        await diplomacyManager.updateFaction(ruler.faction, faction);
                        
                        undoMessage = `Undid excommunication of ${ruler.name}\nCard modifier for ${ruler.faction}: +1 (now ${faction.cardModifier})`;
                    } else {
                        const { reformer } = commandToUndo.data;
                        
                        // Get the reformer data
                        const reformerData = await reformerManager.getReformer(reformer.name);
                        
                        // Update reformer's excommunication status
                        reformerData.isExcommunicated = false;
                        await reformerManager.updateReformer(reformer.name, reformerData);
                        
                        undoMessage = `Undid excommunication of reformer ${reformer.name}`;
                    }
                    break;
                }
                
                case COMMAND_TYPES.REMOVE_EXCOMMUNICATION: {
                    if (commandToUndo.data.ruler) {
                        const { ruler } = commandToUndo.data;
                        
                        // Get the ruler and faction data
                        const rulerData = await rulerManager.getRuler(ruler.name);
                        const faction = await diplomacyManager.getFaction(ruler.faction);
                        
                        // Update ruler's excommunication status
                        rulerData.excommunicated = true;
                        await rulerManager.updateRuler(ruler.name, rulerData);
                        
                        // Restore faction's card modifier
                        faction.cardModifier = (faction.cardModifier || 0) - 1;
                        await diplomacyManager.updateFaction(ruler.faction, faction);
                        
                        undoMessage = `Undid removal of excommunication for ${ruler.name}\nCard modifier for ${ruler.faction}: -1 (now ${faction.cardModifier})`;
                    } else {
                        const { reformer } = commandToUndo.data;
                        
                        // Get the reformer data
                        const reformerData = await reformerManager.getReformer(reformer.name);
                        
                        // Update reformer's excommunication status
                        reformerData.isExcommunicated = true;
                        await reformerManager.updateReformer(reformer.name, reformerData);
                        
                        undoMessage = `Undid removal of excommunication for reformer ${reformer.name}`;
                    }
                    break;
                }
                
                case COMMAND_TYPES.RULER_CHANGE: {
                    const { oldRuler, newRuler } = commandToUndo.data;
                    
                    // Restore old ruler as current
                    oldRuler.isCurrentRuler = true;
                    await rulerManager.updateRuler(oldRuler.name, oldRuler);
                    
                    // Remove current status from new ruler
                    newRuler.isCurrentRuler = false;
                    await rulerManager.updateRuler(newRuler.name, newRuler);
                    
                    undoMessage = `Undid ruler change: ${newRuler.name} -> ${oldRuler.name}`;
                    break;
                }

                case COMMAND_TYPES.CONVERT_SPACE: {
                    const { space, oldReligion } = commandToUndo.data;
                    const spaceData = await spaceManager.getSpace(space.name);
                    
                    // Restore previous state
                    spaceData.catholic = space.catholic;
                    spaceData.reformer = space.reformer;
                    spaceData.jesuiteUniversity = space.jesuiteUniversity;
                    
                    await spaceManager.updateSpace(space.name, spaceData);
                    
                    let message = `Undid conversion of ${space.name} (restored to ${oldReligion})`;
                    if (space.jesuiteUniversity) {
                        message += ' and restored its Jesuite university';
                    }
                    undoMessage = message;
                    break;
                }

                case COMMAND_TYPES.TAKE_CONTROL: {
                    const { spaceName, power, previousController, homePower } = commandToUndo.data;
                    const spaceData = await spaceManager.getSpace(spaceName);
                    
                    // Restore previous controller
                    spaceData.controllingPower = previousController;
                    await spaceManager.updateSpace(spaceName, spaceData);
                    
                    // Use homePower as fallback when displaying previous controller
                    const displayPreviousController = previousController || homePower;
                    undoMessage = `Undid control change of ${spaceName} (restored control to ${displayPreviousController} from ${power})`;
                    break;
                }

                case COMMAND_TYPES.ADD_FORMATION: {
                    const { spaceName, formation } = commandToUndo.data;
                    const spaceData = await spaceManager.getSpace(spaceName);
                    
                    // Remove the formation
                    spaceData.formations = spaceData.formations.filter(f => f.power !== formation.power);
                    await spaceManager.updateSpace(spaceName, spaceData);
                    
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
                    const spaceData = await spaceManager.getSpace(spaceName);
                    
                    // Remove the Jesuite university
                    spaceData.jesuiteUniversity = false;
                    await spaceManager.updateSpace(spaceName, spaceData);
                    
                    undoMessage = `Removed Jesuite university from ${spaceName}`;
                    break;
                }

                case COMMAND_TYPES.ADD_VP: {
                    const { power, pointsAdded } = commandToUndo.data;
                    await victoryPointsManager.removeVictoryPoints(power, pointsAdded);
                    const newTotal = await victoryPointsManager.getVictoryPoints(power);
                    undoMessage = `Removed ${pointsAdded} victory points from ${power}. New total: ${newTotal}`;
                    break;
                }

                case COMMAND_TYPES.REMOVE_VP: {
                    const { power, pointsRemoved } = commandToUndo.data;
                    await victoryPointsManager.addVictoryPoints(power, pointsRemoved);
                    const newTotal = await victoryPointsManager.getVictoryPoints(power);
                    undoMessage = `Added back ${pointsRemoved} victory points to ${power}. New total: ${newTotal}`;
                    break;
                }

                case COMMAND_TYPES.SET_VP: {
                    const { power, oldTotal } = commandToUndo.data;
                    await victoryPointsManager.setVictoryPoints(power, oldTotal);
                    undoMessage = `Restored ${power}'s victory points to ${oldTotal}`;
                    break;
                }

                case COMMAND_TYPES.ADD_REFORMER: {
                    const { reformer, spaceName } = commandToUndo.data;
                    const space = await spaceManager.getSpace(spaceName);
                    
                    // Remove the reformer from the space
                    space.reformers = space.reformers.filter(r => r !== reformer.name);
                    await spaceManager.updateSpace(spaceName, space);
                    
                    undoMessage = `Removed reformer ${reformer.name} from ${spaceName}`;
                    break;
                }

                case COMMAND_TYPES.REMOVE_REFORMER: {
                    const { reformer, spaceName } = commandToUndo.data;
                    const space = await spaceManager.getSpace(spaceName);
                    
                    // Add the reformer back to the space
                    if (!space.reformers) {
                        space.reformers = [];
                    }
                    space.reformers.push(reformer.name);
                    await spaceManager.updateSpace(spaceName, space);
                    
                    undoMessage = `Added back reformer ${reformer.name} to ${spaceName}`;
                    break;
                }

                case COMMAND_TYPES.DEPLOY_ELECTORATE: {
                    const { electorate, regulars, shouldControl, previousController } = commandToUndo.data;
                    
                    // Restore regulars to the electorate
                    const electorateData = await electorateManager.getElectorate(electorate.name);
                    electorateData.regulars = regulars;
                    
                    // Restore controlMarker if control was changed
                    if (shouldControl) {
                        electorateData.controlMarker = true;
                    }
                    
                    await electorateManager.updateElectorate(electorate.name, electorateData);
                    
                    // Remove Protestant formation if it was added
                    if (regulars > 0) {
                        await formationManager.removeFormation(electorate.name, 'Protestant', regulars, 0, []);
                    }
                    
                    // Restore previous controller if control was changed
                    let message = `Restored ${regulars} regulars to ${electorate.name}`;
                    if (shouldControl) {
                        const space = await spaceManager.getSpace(electorate.name);
                        space.controllingPower = previousController;
                        await spaceManager.updateSpace(electorate.name, space);
                        
                        const displayPreviousController = previousController || space.homePower;
                        message += ` and restored control to ${displayPreviousController}`;
                    }
                    undoMessage = message;
                    break;
                }

                case COMMAND_TYPES.SHUFFLE_DECK: {
                    const { oldState } = commandToUndo.data;
                    const statusPath = path.join(process.cwd(), 'data', 'status.json');
                    const status = JSON.parse(fs.readFileSync(statusPath));
                    
                    // Restore previous deck state
                    status.cardDeck = oldState.cardDeck;
                    status.playedCards = oldState.playedCards;
                    status.currentCardIndex = oldState.currentCardIndex;
                    
                    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
                    
                    undoMessage = `Restored previous deck state (${oldState.cardDeck.length} cards)`;
                    break;
                }

                case COMMAND_TYPES.DRAW_CARDS: {
                    const { power, oldState } = commandToUndo.data;
                    
                    // Restore faction's cards
                    const factionPath = path.join(process.cwd(), 'data', 'factions', `${power}.json`);
                    const faction = JSON.parse(fs.readFileSync(factionPath));
                    faction.cards = oldState.factionCards;
                    fs.writeFileSync(factionPath, JSON.stringify(faction, null, 2));
                    
                    // Restore deck
                    const statusPath = path.join(process.cwd(), 'data', 'status.json');
                    const status = JSON.parse(fs.readFileSync(statusPath));
                    status.cardDeck = oldState.deckCards;
                    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
                    
                    undoMessage = `Undid card draw for ${power}`;
                    break;
                }
                
                default:
                    throw new Error(`Cannot undo command of type: ${commandToUndo.type}`);
            }

            // Mark the command as undone in history
            await commandHistory.markCommandAsUndone(commandToUndo.commandId);
            
            // Add information about when the command was originally executed
            const commandDate = new Date(commandToUndo.timestamp).toLocaleString();
            const response = [
                `✅ ${undoMessage}`,
                '',
                `Original command: ${commandToUndo.command}`,
                `Executed by ${commandToUndo.username} on ${commandDate}`,
                `Command ID: ${commandToUndo.commandId}`
            ].join('\n');

            await interaction.editReply(response);

        } catch (error) {
            console.error('Error in undo command:', error);
            let errorMessage = 'Failed to undo command';
            if (error.message === 'No commands in history to undo') {
                errorMessage = 'No commands to undo';
            } else if (error.message.includes('Command with ID')) {
                errorMessage = error.message;
            }
            
            await interaction.editReply({ 
                content: errorMessage,
                ephemeral: true 
            });
        }
    }
}; 
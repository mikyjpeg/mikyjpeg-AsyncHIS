const { commandHistory, COMMAND_TYPES } = require('../../game/commandHistoryManager');
const rulerManager = require('../../game/rulerManager');
const rulerSuccessionManager = require('../../game/rulerSuccessionManager');

module.exports = {
    name: 'undo',
    description: 'Undo a command. Use !undo [commandId] to undo a specific command, or !undo to undo the last command',
    usage: '!undo [commandId?]',
    async execute(message, args) {
        try {
            // Get the command to undo
            const commandToUndo = args.length > 0 
                ? await commandHistory.getCommand(parseInt(args[0]))
                : await commandHistory.getLastCommand();

            let undoMessage = '';

            switch (commandToUndo.type) {
                case COMMAND_TYPES.EXCOMMUNICATION: {
                    const { ruler } = commandToUndo.data;
                    const updatedRuler = await rulerManager.removeExcommunication(ruler.name);
                    undoMessage = `Undid excommunication of ${updatedRuler.name}`;
                    break;
                }
                
                case COMMAND_TYPES.REMOVE_EXCOMMUNICATION: {
                    const { ruler } = commandToUndo.data;
                    const updatedRuler = await rulerManager.excommunicate(ruler.name);
                    undoMessage = `Undid removal of excommunication for ${updatedRuler.name}`;
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
                
                default:
                    throw new Error(`Cannot undo command of type: ${commandToUndo.type}`);
            }

            // Mark the command as undone in history
            await commandHistory.markCommandAsUndone(commandToUndo.commandId);
            
            // Add information about when the command was originally executed
            const commandDate = new Date(commandToUndo.timestamp).toLocaleString();
            return `${undoMessage}\nOriginal command (ID: ${commandToUndo.commandId}) was executed by ${commandToUndo.username} on ${commandDate}`;

        } catch (error) {
            if (error.message === 'No commands in history to undo') {
                return 'No commands to undo';
            }
            if (error.message.includes('Command with ID')) {
                return error.message;
            }
            throw error;
        }
    }
}; 
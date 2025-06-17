const { COMMAND_TYPES } = require('./commandHistoryManager');
const formationManager = require('./formationManager');
const cardManager = require('./cardManager');
const navalManager = require('./navalManager');

class ActionUndoManager {
    constructor(channelId) {
        this.channelId = channelId;
    }

    // Main undo method that routes to specific handlers
    async undoAction(command) {
        const handler = this.getUndoHandler(command.type);
        if (!handler) {
            throw new Error(`No undo handler found for action type: ${command.type}`);
        }
        await handler(command.data);
    }

    // Get the appropriate undo handler for the action type
    getUndoHandler(type) {
        const handlers = {
            [COMMAND_TYPES.ACTION_ASSAULT_FOREIGN_WAR]: this.undoAssaultForeignWar.bind(this),
            [COMMAND_TYPES.ACTION_BUILD_CORSAIR]: this.undoBuildCorsair.bind(this),
            [COMMAND_TYPES.ACTION_BUILD_NAVAL_SQUADRON]: this.undoBuildNavalSquadron.bind(this),
            [COMMAND_TYPES.ACTION_BUILD_SAINT_PETERS]: this.undoBuildSaintPeters.bind(this),
            [COMMAND_TYPES.ACTION_BURN_BOOKS]: this.undoBurnBooks.bind(this),
            [COMMAND_TYPES.ACTION_BUY_MERCENARY]: this.undoBuyMercenary.bind(this),
            [COMMAND_TYPES.ACTION_CALL_THEOLOGICAL_DEBATE]: this.undoCallTheologicalDebate.bind(this),
            [COMMAND_TYPES.ACTION_COLONIZE]: this.undoColonize.bind(this),
            [COMMAND_TYPES.ACTION_CONQUER]: this.undoConquer.bind(this),
            [COMMAND_TYPES.ACTION_CONTROL_UNFORTIFIED_SPACE]: this.undoControlUnfortifiedSpace.bind(this),
            [COMMAND_TYPES.ACTION_EXPLORE]: this.undoExplore.bind(this),
            [COMMAND_TYPES.ACTION_FOUND_JESUIT_UNIVERSITY]: this.undoFoundJesuitUniversity.bind(this),
            [COMMAND_TYPES.ACTION_INITIATE_PIRACY_IN_SEA_ZONE]: this.undoInitiatePiracyInSeaZone.bind(this),
            [COMMAND_TYPES.ACTION_MOVE_FORMATION_IN_CLEAR]: this.undoMoveFormationInClear.bind(this),
            [COMMAND_TYPES.ACTION_MOVE_FORMATION_OVER_PASS]: this.undoMoveFormationOverPass.bind(this),
            [COMMAND_TYPES.ACTION_NAVAL_MOVE]: this.undoNavalMove.bind(this),
            [COMMAND_TYPES.ACTION_PUBLISH_TREATISE]: this.undoPublishTreatise.bind(this),
            [COMMAND_TYPES.ACTION_RAISE_CAVALRY_SIPAHI]: this.undoRaiseCavalrySipahi.bind(this),
            [COMMAND_TYPES.ACTION_RAISE_REGULAR_TROOP]: this.undoRaiseRegularTroop.bind(this),
            [COMMAND_TYPES.ACTION_TRANSLATE_SCRIPTURE]: this.undoTranslateScripture.bind(this),
            [COMMAND_TYPES.ADD_SQUADRON_TO_PORT]: this.undoAddSquadronToPort.bind(this),
            [COMMAND_TYPES.ADD_CORSAIR_TO_PORT]: this.undoAddCorsairToPort.bind(this),
            [COMMAND_TYPES.ADD_SQUADRONS_TO_SEAZONE]: this.undoAddSquadronsToSeazone.bind(this),
            [COMMAND_TYPES.ADD_CORSAIRS_TO_SEAZONE]: this.undoAddCorsairsToSeazone.bind(this),
            [COMMAND_TYPES.SET_PIRACY_TOKEN]: this.undoSetPiracyToken.bind(this)
        };
        return handlers[type];
    }

    // Individual undo handlers for each action type
    async undoAssaultForeignWar(data) {
        // TODO: Implement undo logic
        throw new Error('Undo not yet implemented for assault_foreign_war');
    }

    async undoBuildCorsair(data) {
        const { spaceName, squadron, cost } = data;
        const nm = navalManager(this.channelId);
        const cm = cardManager(this.channelId);
        
        // Remove the corsair from the port
        await nm.removeSquadronFromPort(spaceName, squadron);

        // Restore the CP
        const status = await cm.getStatus();
        status.currentImpulse.availableCP += cost;
        await cm.saveStatus(status);
    }

    async undoBuildNavalSquadron(data) {
        const { spaceName, squadron, cost } = data;
        const nm = navalManager(this.channelId);
        const cm = cardManager(this.channelId);
        
        // Remove the squadron from the port
        await nm.removeSquadronFromPort(spaceName, squadron);

        // Restore the CP
        const status = await cm.getStatus();
        status.currentImpulse.availableCP += cost;
        await cm.saveStatus(status);
    }

    async undoBuildSaintPeters(data) {
        // TODO: Implement undo logic
        throw new Error('Undo not yet implemented for build_saint_peters');
    }

    async undoBurnBooks(data) {
        // TODO: Implement undo logic
        throw new Error('Undo not yet implemented for burn_books');
    }

    async undoBuyMercenary(data) {
        // Get managers
        const fm = formationManager(this.channelId);
        const cm = cardManager(this.channelId);

        // Remove the mercenary from the space
        await fm.removeFormation(data.spaceName, data.power, 0, 1, []);

        // Restore the CP
        const status = await cm.getStatus();
        status.currentImpulse.availableCP += data.cost;
        await cm.saveStatus(status);
    }

    async undoCallTheologicalDebate(data) {
        // TODO: Implement undo logic
        throw new Error('Undo not yet implemented for call_theological_debate');
    }

    async undoColonize(data) {
        // TODO: Implement undo logic
        throw new Error('Undo not yet implemented for colonize');
    }

    async undoConquer(data) {
        // TODO: Implement undo logic
        throw new Error('Undo not yet implemented for conquer');
    }

    async undoControlUnfortifiedSpace(data) {
        // TODO: Implement undo logic
        throw new Error('Undo not yet implemented for control_unfortified_space');
    }

    async undoExplore(data) {
        // TODO: Implement undo logic
        throw new Error('Undo not yet implemented for explore');
    }

    async undoFoundJesuitUniversity(data) {
        // TODO: Implement undo logic
        throw new Error('Undo not yet implemented for found_jesuit_university');
    }

    async undoInitiatePiracyInSeaZone(data) {
        // TODO: Implement undo logic
        throw new Error('Undo not yet implemented for initiate_piracy_in_sea_zone');
    }

    async undoMoveFormationInClear(data) {
        // TODO: Implement undo logic
        throw new Error('Undo not yet implemented for move_formation_in_clear');
    }

    async undoMoveFormationOverPass(data) {
        // TODO: Implement undo logic
        throw new Error('Undo not yet implemented for move_formation_over_pass');
    }

    async undoNavalMove(data) {
        // TODO: Implement undo logic
        throw new Error('Undo not yet implemented for naval_move');
    }

    async undoPublishTreatise(data) {
        // TODO: Implement undo logic
        throw new Error('Undo not yet implemented for publish_treatise');
    }

    async undoRaiseCavalrySipahi(data) {
        // Get managers
        const fm = formationManager(this.channelId);
        const cm = cardManager(this.channelId);

        // Remove the cavalry from the space (0 regular, 1 cavalry)
        await fm.removeFormation(data.spaceName, data.power, 0, 1, []);

        // Restore the CP
        const status = await cm.getStatus();
        status.currentImpulse.availableCP += data.cost;
        await cm.saveStatus(status);
    }

    async undoRaiseRegularTroop(data) {
        // Get managers
        const fm = formationManager(this.channelId);
        const cm = cardManager(this.channelId);

        // Remove the regular from the space
        await fm.removeFormation(data.spaceName, data.power, 1, 0, []);

        // Restore the CP
        const status = await cm.getStatus();
        status.currentImpulse.availableCP += data.cost;
        await cm.saveStatus(status);
    }

    async undoTranslateScripture(data) {
        // TODO: Implement undo logic
        throw new Error('Undo not yet implemented for translate_scripture');
    }

    async undoAddSquadronToPort(data) {
        // Get managers
        const nm = navalManager(this.channelId);

        // Create squadron object to remove
        const squadron = {
            power: data.squadron.power,
            squadron: data.squadron.squadron,
            loans: data.squadron.loans || []
        };

        // Remove the squadron
        await nm.removeSquadronFromPort(data.spaceName, squadron);
    }

    async undoAddCorsairToPort(data) {
        // Get managers
        const nm = navalManager(this.channelId);

        // Create corsair object to remove
        const squadron = {
            power: 'Ottoman',
            corsair: data.squadron.corsair,
            loans: []
        };

        // Remove the corsair
        await nm.removeSquadronFromPort(data.spaceName, squadron);
    }

    async undoAddSquadronsToSeazone(data) {
        // Get managers
        const nm = navalManager(this.channelId);

        // Create squadron object to remove
        const squadron = {
            power: data.squadron.power,
            squadron: data.squadron.squadron,
            loans: data.squadron.loans || []
        };

        // Remove the squadron
        await nm.removeSquadronFromSeaZone(data.seaZoneName, squadron);
    }

    async undoAddCorsairsToSeazone(data) {
        // Get managers
        const nm = navalManager(this.channelId);

        // Create corsair object to remove
        const squadron = {
            power: 'Ottoman',
            corsair: data.squadron.corsair,
            loans: []
        };

        // Remove the corsair
        await nm.removeSquadronFromSeaZone(data.seaZoneName, squadron);
    }

    async undoSetPiracyToken(data) {
        const nm = navalManager(this.channelId);
        // If removed is true, it means we need to add back the token
        // If removed is false or undefined, it means we need to remove the token
        await nm.setPiracyToken(data.seaZoneName, data.removed);
    }
}

// Factory function to create ActionUndoManager instances
const createActionUndoManager = (channelId) => new ActionUndoManager(channelId);

module.exports = {
    actionUndo: createActionUndoManager
}; 
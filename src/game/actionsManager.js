const fs = require('fs').promises;
const path = require('path');
const { FILE_SYSTEM } = require('../utils/constants');
const { getGamePath } = require('../utils/gamePathUtils');
const factionManager = require('./factionManager');
const cardManager = require('./cardManager');

class ActionsManager {
    constructor(channelId) {
        if (!channelId) throw new Error('Channel ID is required');
        this.channelId = channelId;
        this.actionsDir = path.join(process.cwd(), getGamePath(channelId), 'actions');
    }

    async getAction(actionId) {
        try {
            const filePath = path.join(this.actionsDir, `${actionId}.json`);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            throw new Error(`Action ${actionId} not found`);
        }
    }

    async validateAction(actionId, power) {
        if (!power) {
            throw new Error('Power must be specified to validate action');
        }

        // Get the action definition
        const action = await this.getAction(actionId);

        // Check if the power exists in the action's faction list
        if (!action.factions[power]) {
            throw new Error(`Power ${power} is not valid for this action`);
        }

        // Check if the power can perform this action
        if (!action.factions[power].canPerform) {
            throw new Error(`${power} cannot perform the action ${action.name}`);
        }

        // Get the faction to verify it exists and is active
        const fm = factionManager(this.channelId);
        const faction = await fm.getFaction(power);
        
        if (!faction.isActive) {
            throw new Error(`${power} is not an active power in this game`);
        }

        return true;
    }

    async getActionCost(actionId, power) {
        const action = await this.getAction(actionId);
        return action.factions[power]?.cost || 1; // Default to 1 if not specified
    }

    async validateAndSpendCP(actionId, power) {
        // Get card manager for this game
        const cm = cardManager(this.channelId);

        // Get current status to check available CP
        const status = await cm.getStatus();
        if (!status.currentImpulse?.availableCP) {
            throw new Error('No CP available. Play a card first.');
        }

        // Get the action cost
        const cost = await this.getActionCost(actionId, power);

        // Check if we have enough CP
        if (status.currentImpulse.availableCP < cost) {
            throw new Error(`Not enough CP available. Action costs ${cost} CP but only ${status.currentImpulse.availableCP} CP remaining.`);
        }

        // Reduce available CP
        status.currentImpulse.availableCP -= cost;
        await cm.saveStatus(status);

        return {
            cost,
            remainingCP: status.currentImpulse.availableCP
        };
    }
}

module.exports = (channelId) => new ActionsManager(channelId); 
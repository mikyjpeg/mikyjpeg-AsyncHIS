const fs = require('fs').promises;
const path = require('path');
const factionManager = require('./factionManager');
const statusManager = require('./statusManager');
const { FILE_SYSTEM } = require('../utils/constants');
const { getGamePath } = require('../utils/gamePathUtils');

const POWERS = {
    OTTOMAN: 'Ottoman',
    HAPSBURG: 'Hapsburg',
    ENGLAND: 'England',
    FRANCE: 'France',
    PAPACY: 'Papacy',
    PROTESTANT: 'Protestant'
};

const GAME_PHASES = {
    SETUP: 'setup',
    CARD_DRAW: 'card_draw',
    DIPLOMACY: 'diplomacy',
    ACTION: 'action',
    WINTER: 'winter'
};

class GameState {
    constructor(channelId) {
        if (!channelId) throw new Error('Channel ID is required');
        this.channelId = channelId;
        this.initialized = false;
    }

    async initialize() {
        if (!this.initialized) {
            await this.getGameStatus();
            this.initialized = true;
        }
    }

    async getAvailablePowers() {
        const allFactions = await factionManager(this.channelId).loadAllFactions();
        return Object.values(POWERS).filter(power => {
            const faction = allFactions[power.toLowerCase()];
            return !faction || !faction.isActive;
        });
    }

    async startGame() {
        await this.initialize();
        
        await statusManager(this.channelId).initializeGame();
        
        for (const power of Object.values(POWERS)) {
            await factionManager(this.channelId).updateFaction(power, {
                discordUserId: null,
                discordUsername: null,
                isActive: false
            });
        }
        
        return await this.getGameStatus();
    }

    async assignPower(userId, username, powerName) {
        await this.initialize();
        
        const status = await statusManager(this.channelId).getStatus();
        if (status.phase === 'setup' && status.turn === 1) {
            const availablePowers = await this.getAvailablePowers();
            if (!availablePowers.includes(powerName)) {
                throw new Error('Power not available');
            }

            const allFactions = await factionManager(this.channelId).loadAllFactions();
            const faction = allFactions[powerName.toLowerCase()];
            if (faction && faction.isActive && faction.discordUserId !== userId) {
                throw new Error(`${powerName} is already controlled by ${faction.discordUsername}`);
            }

            await factionManager(this.channelId).assignUserToFaction(powerName, userId, username);
            
            return await this.getGameStatus();
        } else {
            throw new Error('Game is not in setup phase');
        }
    }

    async leavePower(userId, powerName) {
        await this.initialize();
        
        const status = await statusManager(this.channelId).getStatus();
        if (status.phase === 'setup' && status.turn === 1) {
            const allFactions = await factionManager(this.channelId).loadAllFactions();
            const faction = allFactions[powerName.toLowerCase()];
            
            if (!faction || !faction.isActive) {
                throw new Error(`${powerName} is not currently controlled by anyone`);
            }
            
            if (faction.discordUserId !== userId) {
                throw new Error(`You do not control ${powerName}. It is controlled by ${faction.discordUsername}`);
            }

            await factionManager(this.channelId).updateFaction(powerName, {
                discordUserId: null,
                discordUsername: null,
                isActive: false
            });

            return await this.getGameStatus();
        } else {
            throw new Error('Game is not in setup phase');
        }
    }

    async getGameStatus() {
        const status = await statusManager(this.channelId).getStatus();
        const activeFactions = await factionManager(this.channelId).loadAllFactions();
        const availablePowers = await this.getAvailablePowers();
        
        return {
            ...status,
            availablePowers,
            factions: activeFactions
        };
    }

    async nextTurn() {
        await this.initialize();
        return await statusManager(this.channelId).nextTurn();
    }
}

module.exports = {
    GameState: (channelId) => new GameState(channelId),
    POWERS,
    GAME_PHASES
}; 
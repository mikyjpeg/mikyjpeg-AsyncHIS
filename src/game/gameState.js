const fs = require('fs').promises;
const path = require('path');
const factionManager = require('./factionManager');
const statusManager = require('./statusManager');
const { FILE_SYSTEM } = require('../utils/constants');

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
    constructor() {
        this.filepath = path.join(__dirname, '../../data/gameState.json');
        this.availablePowers = [...Object.values(POWERS)];
        this.initialized = false;
    }

    async initialize() {
        if (!this.initialized) {
            await this.load();
            this.initialized = true;
        }
    }

    async load() {
        try {
            const data = await fs.readFile(this.filepath, 'utf8');
            if (!data) {
                // If file is empty, initialize with default state
                return this.save({ availablePowers: [...Object.values(POWERS)] });
            }
            const state = JSON.parse(data);
            this.availablePowers = state.availablePowers || [...Object.values(POWERS)];
            return state;
        } catch (error) {
            if (error.code === 'ENOENT') {
                // If file doesn't exist, create with default state
                return this.save({ availablePowers: [...Object.values(POWERS)] });
            }
            console.error('Error loading game state:', error);
            throw error;
        }
    }

    async save(state) {
        try {
            await fs.mkdir(path.dirname(this.filepath), { recursive: true });
            const saveState = {
                ...state,
                availablePowers: this.availablePowers
            };
            await fs.writeFile(this.filepath, JSON.stringify(saveState, null, FILE_SYSTEM.JSON_INDENT));
            return saveState;
        } catch (error) {
            console.error('Error saving game state:', error);
            throw error;
        }
    }

    async startGame() {
        await this.initialize();
        
        // Initialize game status
        await statusManager.initializeGame();
        
        // Reset all factions
        for (const power of Object.values(POWERS)) {
            await factionManager.updateFaction(power, {
                discordUserId: null,
                discordUsername: null,
                isActive: false
            });
        }
        
        // Reset available powers
        this.availablePowers = [...Object.values(POWERS)];
        const state = await this.save({ availablePowers: this.availablePowers });
        
        return await this.getGameStatus();
    }

    async assignPower(userId, username, powerName) {
        await this.initialize();
        
        const status = await statusManager.getStatus();
        if (status.phase === 'setup' && status.turn === 1) {
            // Game is in initial setup phase, proceed with power assignment
            if (!this.availablePowers.includes(powerName)) {
                throw new Error('Power not available');
            }

            // Check if power is already controlled by someone
            const allFactions = await factionManager.loadAllFactions();
            const faction = allFactions[powerName.toLowerCase()];
            if (faction && faction.isActive && faction.discordUserId !== userId) {
                throw new Error(`${powerName} is already controlled by ${faction.discordUsername}`);
            }

            // Remove the power from available powers
            this.availablePowers = this.availablePowers.filter(p => p !== powerName);
            await this.save({ availablePowers: this.availablePowers });

            // Update faction data
            await factionManager.assignUserToFaction(powerName, userId, username);
            
            return await this.getGameStatus();
        } else {
            throw new Error('Game is not in setup phase');
        }
    }

    async leavePower(userId, powerName) {
        await this.initialize();
        
        const status = await statusManager.getStatus();
        if (status.phase === 'setup' && status.turn === 1) {
            // Verify the user controls this power
            const allFactions = await factionManager.loadAllFactions();
            const faction = allFactions[powerName.toLowerCase()];
            
            if (!faction || !faction.isActive) {
                throw new Error(`${powerName} is not currently controlled by anyone`);
            }
            
            if (faction.discordUserId !== userId) {
                throw new Error(`You do not control ${powerName}. It is controlled by ${faction.discordUsername}`);
            }

            // Reset the faction
            await factionManager.updateFaction(powerName, {
                discordUserId: null,
                discordUsername: null,
                isActive: false
            });

            // Make the power available again
            if (!this.availablePowers.includes(powerName)) {
                this.availablePowers.push(powerName);
                await this.save({ availablePowers: this.availablePowers });
            }

            return await this.getGameStatus();
        } else {
            throw new Error('Game is not in setup phase');
        }
    }

    async getGameStatus() {
        await this.initialize();
        const status = await statusManager.getStatus();
        const activeFactions = await factionManager.loadAllFactions();
        
        return {
            ...status,
            availablePowers: this.availablePowers,
            factions: activeFactions
        };
    }
}

const gameState = new GameState();

module.exports = {
    GameState: gameState,
    POWERS,
    GAME_PHASES
}; 
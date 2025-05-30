const fs = require('fs').promises;
const path = require('path');

class FactionManager {
    constructor() {
        this.factionsDir = path.join(__dirname, '../../data/factions');
        this.factions = {};
        this.defaultFactionData = {
            discordUserId: null,
            discordUsername: null,
            isActive: false,
            victoryPoints: 0,
            lastUpdated: null
        };
    }

    async ensureFactionsDirectory() {
        try {
            await fs.mkdir(this.factionsDir, { recursive: true });
        } catch (error) {
            console.error('Error creating factions directory:', error);
            throw error;
        }
    }

    async initializeFactionFile(factionName) {
        const filePath = path.join(this.factionsDir, `${factionName.toLowerCase()}.json`);
        const initialData = {
            ...this.defaultFactionData,
            name: factionName,
            lastUpdated: new Date().toISOString()
        };
        
        try {
            await fs.writeFile(filePath, JSON.stringify(initialData, null, 4));
            return initialData;
        } catch (error) {
            console.error(`Error initializing faction file ${factionName}:`, error);
            throw error;
        }
    }

    async loadAllFactions() {
        try {
            await this.ensureFactionsDirectory();
            
            let files;
            try {
                files = await fs.readdir(this.factionsDir);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    files = [];
                } else {
                    throw error;
                }
            }

            this.factions = {};
            
            // Initialize missing faction files
            const expectedFactions = ['ottoman', 'hapsburg', 'england', 'france', 'papacy', 'protestant'];
            for (const faction of expectedFactions) {
                if (!files.includes(`${faction}.json`)) {
                    this.factions[faction] = await this.initializeFactionFile(faction);
                }
            }

            // Load existing faction files
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const factionName = path.basename(file, '.json');
                    try {
                        const data = await fs.readFile(path.join(this.factionsDir, file), 'utf8');
                        this.factions[factionName] = JSON.parse(data);
                    } catch (error) {
                        console.error(`Error reading faction file ${file}:`, error);
                        // If the file is corrupted, reinitialize it
                        this.factions[factionName] = await this.initializeFactionFile(factionName);
                    }
                }
            }

            return this.factions;
        } catch (error) {
            console.error('Error loading factions:', error);
            throw error;
        }
    }

    async getFaction(factionName) {
        const filePath = path.join(this.factionsDir, `${factionName.toLowerCase()}.json`);
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                // If the file doesn't exist, create it
                return await this.initializeFactionFile(factionName);
            }
            console.error(`Error loading faction ${factionName}:`, error);
            throw error;
        }
    }

    async updateFaction(factionName, updates) {
        const filePath = path.join(this.factionsDir, `${factionName.toLowerCase()}.json`);
        try {
            let currentData = await this.getFaction(factionName);
            const updatedData = {
                ...currentData,
                ...updates,
                lastUpdated: new Date().toISOString()
            };
            await fs.writeFile(filePath, JSON.stringify(updatedData, null, 4));
            this.factions[factionName.toLowerCase()] = updatedData;
            return updatedData;
        } catch (error) {
            console.error(`Error updating faction ${factionName}:`, error);
            throw error;
        }
    }

    async assignUserToFaction(factionName, userId, username) {
        return this.updateFaction(factionName, {
            discordUserId: userId,
            discordUsername: username,
            isActive: true
        });
    }

    async updateVictoryPoints(factionName, points) {
        const faction = await this.getFaction(factionName);
        return this.updateFaction(factionName, {
            victoryPoints: (faction.victoryPoints || 0) + points
        });
    }

    async getActiveFactions() {
        await this.loadAllFactions();
        return Object.values(this.factions).filter(f => f.isActive);
    }

    async getFactionByUserId(userId) {
        await this.loadAllFactions();
        return Object.values(this.factions).find(f => f.discordUserId === userId);
    }
}

module.exports = new FactionManager(); 
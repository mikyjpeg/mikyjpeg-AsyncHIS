const fs = require('fs').promises;
const path = require('path');
const factionManager = require('./factionManager');
const { FILE_SYSTEM } = require('../utils/constants');

class LeaderManager {
    constructor() {
        this.leadersDir = path.join(__dirname, '../../data/leaders');
    }

    async getLeader(leaderName) {
        const filename = `${leaderName.toLowerCase().replace(/\s+/g, '_')}.json`;
        const filePath = path.join(this.leadersDir, filename);
        
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            throw new Error(`Leader ${leaderName} not found`);
        }
    }

    async updateLeader(leaderName, leader) {
        const filePath = path.join(this.leadersDir, `${leaderName.toLowerCase()}.json`);
        await fs.writeFile(filePath, JSON.stringify(leader, null, FILE_SYSTEM.JSON_INDENT));
    }

    async captureLeader(leaderName, capturingFaction) {
        // Get the leader
        const leader = await this.getLeader(leaderName);
        
        // Validate the leader isn't already captured
        if (leader.isCaptured) {
            throw new Error(`${leaderName} is already captured`);
        }

        // Get the capturing faction
        const faction = await factionManager.getFaction(capturingFaction);

        // Validate the leader isn't from the capturing faction
        if (leader.power === faction.name) {
            throw new Error(`${faction.name} cannot capture their own leader`);
        }

        // Update leader status
        leader.isCaptured = true;
        await this.updateLeader(leaderName, leader);

        // Add leader to faction's captives
        faction.captiveLeaders.push(leaderName);
        await factionManager.updateFaction(faction.name, faction);

        return { leader, faction };
    }

    async releaseLeader(leaderName, releasingFaction) {
        // Get the leader
        const leader = await this.getLeader(leaderName);
        
        // Validate the leader is captured
        if (!leader.isCaptured) {
            throw new Error(`${leaderName} is not captured`);
        }

        // Get the releasing faction
        const faction = await factionManager.getFaction(releasingFaction);

        // Validate the faction has the leader captive
        if (!faction.captiveLeaders.includes(leaderName)) {
            throw new Error(`${faction.name} does not have ${leaderName} as captive`);
        }

        // Update leader status
        leader.isCaptured = false;
        await this.updateLeader(leaderName, leader);

        // Remove leader from faction's captives
        faction.captiveLeaders = faction.captiveLeaders.filter(name => name !== leaderName);
        await factionManager.updateFaction(faction.name, faction);

        return { leader, faction };
    }
}

module.exports = new LeaderManager(); 
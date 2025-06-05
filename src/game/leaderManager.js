const fs = require('fs').promises;
const path = require('path');
const factionManager = require('./factionManager');
const { FILE_SYSTEM } = require('../utils/constants');
const { getGamePath } = require('../utils/gamePathUtils');

class LeaderManager {
    constructor(channelId) {
        if (!channelId) throw new Error('Channel ID is required');
        this.leadersDir = path.join(process.cwd(), getGamePath(channelId), 'leaders');
        // Store channelId for creating faction manager instances
        this.channelId = channelId;
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
        const leader = await this.getLeader(leaderName);
        
        if (leader.isCaptured) {
            throw new Error(`${leaderName} is already captured`);
        }

        const faction = await factionManager(this.channelId).getFaction(capturingFaction);

        if (leader.power === faction.name) {
            throw new Error(`${faction.name} cannot capture their own leader`);
        }

        leader.isCaptured = true;
        await this.updateLeader(leaderName, leader);

        faction.captiveLeaders.push(leaderName);
        await factionManager(this.channelId).updateFaction(faction.name, faction);

        return { leader, faction };
    }

    async releaseLeader(leaderName, releasingFaction) {
        const leader = await this.getLeader(leaderName);
        
        if (!leader.isCaptured) {
            throw new Error(`${leaderName} is not captured`);
        }

        const faction = await factionManager(this.channelId).getFaction(releasingFaction);

        if (!faction.captiveLeaders.includes(leaderName)) {
            throw new Error(`${faction.name} does not have ${leaderName} as captive`);
        }

        leader.isCaptured = false;
        await this.updateLeader(leaderName, leader);

        faction.captiveLeaders = faction.captiveLeaders.filter(name => name !== leaderName);
        await factionManager(this.channelId).updateFaction(faction.name, faction);

        return { leader, faction };
    }
}

module.exports = (channelId) => new LeaderManager(channelId); 
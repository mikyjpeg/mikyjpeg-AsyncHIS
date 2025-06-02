const statusManager = require('./statusManager');
const factionManager = require('./factionManager');

class VictoryPointsManager {
    constructor() {
        this.validPowers = ['Ottoman', 'Hapsburg', 'England', 'France', 'Papacy', 'Protestant'];
    }

    async addVictoryPoints(power, points) {
        // Validate power
        if (!this.validPowers.includes(power)) {
            throw new Error(`Invalid power. Must be one of: ${this.validPowers.join(', ')}`);
        }

        // Update status
        await statusManager.updateVictoryPoints(power, points);

        // Update faction
        const faction = await factionManager.getFaction(power);
        await factionManager.updateFaction(power, {
            ...faction,
            victoryPoints: (faction.victoryPoints || 0) + points
        });

        return points;
    }

    async removeVictoryPoints(power, points) {
        return this.addVictoryPoints(power, -points);
    }

    async setVictoryPoints(power, points) {
        // Validate power
        if (!this.validPowers.includes(power)) {
            throw new Error(`Invalid power. Must be one of: ${this.validPowers.join(', ')}`);
        }

        // Get current points to calculate difference
        const faction = await factionManager.getFaction(power);
        const currentPoints = faction.victoryPoints || 0;
        const difference = points - currentPoints;

        // Update both status and faction
        await statusManager.updateVictoryPoints(power, difference);
        await factionManager.updateFaction(power, {
            ...faction,
            victoryPoints: points
        });

        return points;
    }

    async getVictoryPoints(power) {
        const faction = await factionManager.getFaction(power);
        return faction.victoryPoints || 0;
    }
}

module.exports = new VictoryPointsManager(); 
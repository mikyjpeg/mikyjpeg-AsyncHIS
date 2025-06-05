const fs = require('fs').promises;
const path = require('path');
const { validateAlliance, canRemoveAlliance } = require('./diplomacyRules');
const { FILE_SYSTEM } = require('../utils/constants');
const { getGamePath } = require('../utils/gamePathUtils');

class DiplomacyManager {
    constructor(channelId) {
        if (!channelId) throw new Error('Channel ID is required');
        this.factionsDir = path.join(process.cwd(), getGamePath(channelId), 'factions');
    }

    async getFaction(factionName) {
        try {
            const filePath = path.join(this.factionsDir, `${factionName.toLowerCase()}.json`);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            throw new Error(`Faction "${factionName}" not found`);
        }
    }

    async updateFaction(factionName, factionData) {
        try {
            const filePath = path.join(this.factionsDir, `${factionName.toLowerCase()}.json`);
            await fs.writeFile(filePath, JSON.stringify(factionData, null, FILE_SYSTEM.JSON_INDENT));
            return factionData;
        } catch (error) {
            throw new Error(`Failed to update faction "${factionName}": ${error.message}`);
        }
    }

    async declareWar(power1, power2) {
        const faction1 = await this.getFaction(power1);
        const faction2 = await this.getFaction(power2);

        // Remove any existing alliances
        faction1.alliances = faction1.alliances.filter(p => p !== power2);
        faction2.alliances = faction2.alliances.filter(p => p !== power1);

        // Add to atWarWith if not already there
        if (!faction1.atWarWith.includes(power2)) {
            faction1.atWarWith.push(power2);
        }
        if (!faction2.atWarWith.includes(power1)) {
            faction2.atWarWith.push(power1);
        }

        await this.updateFaction(power1, faction1);
        await this.updateFaction(power2, faction2);

        return { faction1, faction2 };
    }

    async makePeace(power1, power2) {
        const faction1 = await this.getFaction(power1);
        const faction2 = await this.getFaction(power2);

        // Remove from atWarWith
        faction1.atWarWith = faction1.atWarWith.filter(p => p !== power2);
        faction2.atWarWith = faction2.atWarWith.filter(p => p !== power1);

        await this.updateFaction(power1, faction1);
        await this.updateFaction(power2, faction2);

        return { faction1, faction2 };
    }

    async declareAlliance(power1, power2) {
        // Validate alliance
        const validationResult = validateAlliance(power1, power2);
        if (!validationResult.valid) {
            throw new Error(validationResult.reason);
        }

        const faction1 = await this.getFaction(power1);
        const faction2 = await this.getFaction(power2);

        // Check if they're at war
        if (faction1.atWarWith.includes(power2) || faction2.atWarWith.includes(power1)) {
            throw new Error('Powers at war cannot form an alliance');
        }

        // Add alliance if not already there
        if (!faction1.alliances.includes(power2)) {
            faction1.alliances.push(power2);
        }
        if (!faction2.alliances.includes(power1)) {
            faction2.alliances.push(power1);
        }

        await this.updateFaction(power1, faction1);
        await this.updateFaction(power2, faction2);

        return { faction1, faction2 };
    }

    async removeAlliance(power1, power2) {
        // Check if either power can remove alliances
        if (!canRemoveAlliance(power1) || !canRemoveAlliance(power2)) {
            throw new Error('One or both powers cannot remove their alliances');
        }

        const faction1 = await this.getFaction(power1);
        const faction2 = await this.getFaction(power2);

        // Remove alliance
        faction1.alliances = faction1.alliances.filter(p => p !== power2);
        faction2.alliances = faction2.alliances.filter(p => p !== power1);

        await this.updateFaction(power1, faction1);
        await this.updateFaction(power2, faction2);

        return { faction1, faction2 };
    }
}

module.exports = (channelId) => new DiplomacyManager(channelId); 
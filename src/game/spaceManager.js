const fs = require('fs').promises;
const path = require('path');

// Define valid powers
const VALID_POWERS = {
    MAJOR: ['Ottoman', 'Hapsburg', 'England', 'France', 'Papacy', 'Protestant'],
    MINOR: ['Venice', 'Genoa', 'Hungary', 'Scotland', 'Independent']
};

class SpaceManager {
    constructor() {
        this.spacesDir = path.join(__dirname, '../../data/spaces');
    }

    isValidPower(power) {
        const normalizedPower = power.charAt(0).toUpperCase() + power.slice(1).toLowerCase();
        return [...VALID_POWERS.MAJOR, ...VALID_POWERS.MINOR].includes(normalizedPower);
    }

    async getAllSpaces() {
        const files = await fs.readdir(this.spacesDir);
        const spaces = [];
        for (const file of files) {
            if (file.endsWith('.json')) {
                const data = await fs.readFile(path.join(this.spacesDir, file), 'utf8');
                spaces.push(JSON.parse(data));
            }
        }
        return spaces;
    }

    async getSpace(spaceName) {
        try {
            const fileName = `${spaceName.toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '')}.json`;
            const filePath = path.join(this.spacesDir, fileName);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            throw new Error(`Space "${spaceName}" not found`);
        }
    }

    async updateSpace(spaceName, spaceData) {
        try {
            const fileName = `${spaceName.toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '')}.json`;
            const filePath = path.join(this.spacesDir, fileName);
            await fs.writeFile(filePath, JSON.stringify(spaceData, null, 2));
            return spaceData;
        } catch (error) {
            throw new Error(`Failed to update space "${spaceName}": ${error.message}`);
        }
    }

    async takeControl(spaceName, power, userId) {
        // Validate power
        if (!this.isValidPower(power)) {
            throw new Error(`Invalid power "${power}". Must be one of: ${[...VALID_POWERS.MAJOR, ...VALID_POWERS.MINOR].join(', ')}`);
        }

        const normalizedPower = power.charAt(0).toUpperCase() + power.slice(1).toLowerCase();
        const space = await this.getSpace(spaceName);
        space.controllingPower = normalizedPower;
        return await this.updateSpace(spaceName, space);
    }

    async removeControl(spaceName) {
        const space = await this.getSpace(spaceName);
        space.controllingPower = null;
        return await this.updateSpace(spaceName, space);
    }

    async getControlledSpaces(power) {
        if (!this.isValidPower(power)) {
            throw new Error(`Invalid power "${power}"`);
        }

        const normalizedPower = power.charAt(0).toUpperCase() + power.slice(1).toLowerCase();
        const allSpaces = await this.getAllSpaces();
        return allSpaces.filter(space => space.controllingPower === normalizedPower);
    }

    async validateUserControl(userId, power, factionManager) {
        const faction = await factionManager.getFactionByUserId(userId);
        if (!faction) {
            throw new Error('You are not controlling any power');
        }

        const normalizedPower = power.charAt(0).toUpperCase() + power.slice(1).toLowerCase();
        if (faction.name.toLowerCase() !== normalizedPower.toLowerCase()) {
            throw new Error(`You can only control spaces as ${faction.name}`);
        }

        return true;
    }
}

module.exports = new SpaceManager(); 
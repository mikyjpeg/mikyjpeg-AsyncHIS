const fs = require('fs').promises;
const path = require('path');
const { FILE_SYSTEM } = require('../utils/constants');
const spaceManager = require('./spaceManager');
const { getGamePath } = require('../utils/gamePathUtils');

class ReformerManager {
    constructor(channelId) {
        if (!channelId) throw new Error('Channel ID is required');
        this.channelId = channelId;
        this.reformersDir = path.join(process.cwd(), getGamePath(channelId), 'reformers');
    }

    async #readReformerFile(name) {
        try {
            const filePath = path.join(this.reformersDir, `${name.toLowerCase().replace(/\s+/g, '_')}.json`);
            const data = await fs.readFile(filePath, 'utf8');
            return { filePath, data: JSON.parse(data) };
        } catch (error) {
            throw new Error(`Reformer ${name} not found`);
        }
    }

    async getReformer(name) {
        const { data: reformer } = await this.#readReformerFile(name);
        return reformer;
    }

    async updateReformer(name, reformerData) {
        const { filePath } = await this.#readReformerFile(name);
        await fs.writeFile(filePath, JSON.stringify(reformerData, null, FILE_SYSTEM.JSON_INDENT));
        return reformerData;
    }

    async getReformerLocation(name) {
        const { data: reformer } = await this.#readReformerFile(name);
        return reformer.location;
    }

    async validateReformerLocation(name, spaceName) {
        const location = await this.getReformerLocation(name);
        if (location !== spaceName) {
            throw new Error(`${name} can only be placed in ${location}`);
        }
    }

    async addReformerToSpace(name) {
        const { data: reformer } = await this.#readReformerFile(name);
        const sm = spaceManager(this.channelId);
        const space = await sm.getSpace(reformer.location);

        // Initialize reformers array if it doesn't exist
        if (!space.reformers) {
            space.reformers = [];
        }

        // Check if reformer is already in the space
        if (space.reformers.includes(name)) {
            throw new Error(`${name} is already in ${reformer.location}`);
        }

        // Set reformer as active
        reformer.isActive = true;
        await this.updateReformer(name, reformer);

        // Add the reformer to the space
        space.reformers.push(name);
        await sm.updateSpace(reformer.location, space);
        return { reformer, space };
    }

    async removeReformerFromSpace(name) {
        const { data: reformer } = await this.#readReformerFile(name);
        const sm = spaceManager(this.channelId);
        const space = await sm.getSpace(reformer.location);

        // Check if reformer is in the space
        if (!space.reformers || !space.reformers.includes(name)) {
            throw new Error(`${name} is not in ${reformer.location}`);
        }

        // Set reformer as inactive
        reformer.isActive = false;
        await this.updateReformer(name, reformer);

        // Remove the reformer from the space
        space.reformers = space.reformers.filter(r => r !== name);
        await sm.updateSpace(reformer.location, space);
        return { reformer, space };
    }

    async excommunicate(name) {
        const { filePath, data: reformer } = await this.#readReformerFile(name);
        if (reformer.isExcommunicated) {
            throw new Error(`${name} is already excommunicated`);
        }

        reformer.isExcommunicated = true;
        await fs.writeFile(filePath, JSON.stringify(reformer, null, FILE_SYSTEM.JSON_INDENT));
        return reformer;
    }

    async removeExcommunication(name) {
        const { filePath, data: reformer } = await this.#readReformerFile(name);
        if (!reformer.isExcommunicated) {
            throw new Error(`${name} is not excommunicated`);
        }

        reformer.isExcommunicated = false;
        await fs.writeFile(filePath, JSON.stringify(reformer, null, FILE_SYSTEM.JSON_INDENT));
        return reformer;
    }
}

module.exports = (channelId) => new ReformerManager(channelId); 
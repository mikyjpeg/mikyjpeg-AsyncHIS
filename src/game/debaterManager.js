const fs = require('fs').promises;
const path = require('path');
const { FILE_SYSTEM } = require('../utils/constants');

class DebaterManager {
    constructor() {
        this.debatersDir = path.join(__dirname, '../../data/debaters');
    }

    async #readDebaterFile(name) {
        try {
            const filePath = path.join(this.debatersDir, `${name.toLowerCase().replace(/\s+/g, '_')}.json`);
            const data = await fs.readFile(filePath, 'utf8');
            return { filePath, data: JSON.parse(data) };
        } catch (error) {
            throw new Error(`Debater ${name} not found`);
        }
    }

    async #updateDebater(name, debaterData) {
        const filePath = path.join(this.debatersDir, `${name.toLowerCase().replace(/\s+/g, '_')}.json`);
        await fs.writeFile(filePath, JSON.stringify(debaterData, null, FILE_SYSTEM.JSON_INDENT));
        return debaterData;
    }

    async #clearCurrentDebater(type) {
        // Read all debater files
        const files = await fs.readdir(this.debatersDir);
        
        for (const file of files) {
            if (!file.endsWith('.json')) continue;
            
            const filePath = path.join(this.debatersDir, file);
            const data = await fs.readFile(filePath, 'utf8');
            const debater = JSON.parse(data);
            
            // If this is a debater of the specified type and they're the current debater
            if (debater.type === type && debater.isCurrentDebater) {
                debater.isCurrentDebater = false;
                await fs.writeFile(filePath, JSON.stringify(debater, null, FILE_SYSTEM.JSON_INDENT));
                return debater.name;
            }
        }
        
        return null;
    }

    async commitDebater(name) {
        const { data: debater } = await this.#readDebaterFile(name);
        
        if (debater.isCommitted) {
            throw new Error(`${name} is already committed`);
        }

        debater.isCommitted = true;
        await this.#updateDebater(name, debater);
        return debater;
    }

    async uncommitDebater(name) {
        const { data: debater } = await this.#readDebaterFile(name);
        
        if (!debater.isCommitted) {
            throw new Error(`${name} is not committed`);
        }

        debater.isCommitted = false;
        await this.#updateDebater(name, debater);
        return debater;
    }

    async setCurrentDebater(name) {
        const { data: debater } = await this.#readDebaterFile(name);
        
        if (debater.isCurrentDebater) {
            throw new Error(`${name} is already the current debater`);
        }

        // Clear any existing current debater of the same type
        const previousDebater = await this.#clearCurrentDebater(debater.type);

        // Set this debater as current
        debater.isCurrentDebater = true;
        await this.#updateDebater(name, debater);
        
        return { debater, previousDebater };
    }

    async clearCurrentDebater(name) {
        const { data: debater } = await this.#readDebaterFile(name);
        
        if (!debater.isCurrentDebater) {
            throw new Error(`${name} is not the current debater`);
        }

        debater.isCurrentDebater = false;
        await this.#updateDebater(name, debater);
        return debater;
    }
}

module.exports = new DebaterManager(); 
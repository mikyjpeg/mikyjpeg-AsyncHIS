const fs = require('fs').promises;
const path = require('path');
const { FILE_SYSTEM } = require('../utils/constants');

class ElectorateManager {
    constructor() {
        this.electoratesDir = path.join(__dirname, '../../data/electorates');
    }

    async #readElectorateFile(name) {
        try {
            const filePath = path.join(this.electoratesDir, `${name.toLowerCase().replace(/\s+/g, '_')}.json`);
            const data = await fs.readFile(filePath, 'utf8');
            return { filePath, data: JSON.parse(data) };
        } catch (error) {
            throw new Error(`Electorate ${name} not found`);
        }
    }

    async #updateElectorate(name, electorateData) {
        const filePath = path.join(this.electoratesDir, `${name.toLowerCase().replace(/\s+/g, '_')}.json`);
        await fs.writeFile(filePath, JSON.stringify(electorateData, null, FILE_SYSTEM.JSON_INDENT));
        return electorateData;
    }

    async getElectorate(name) {
        const { data } = await this.#readElectorateFile(name);
        return data;
    }

    async clearRegulars(name) {
        const { data: electorate } = await this.#readElectorateFile(name);
        const regulars = electorate.regulars || 0;
        electorate.regulars = 0;
        await this.#updateElectorate(name, electorate);
        return { electorate, regulars };
    }

    async updateElectorate(name, electorateData) {
        return this.#updateElectorate(name, electorateData);
    }
}

module.exports = new ElectorateManager(); 
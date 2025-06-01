const fs = require('fs').promises;
const path = require('path');
const { FILE_SYSTEM } = require('../utils/constants');

class StatusManager {
    constructor() {
        this.filepath = path.join(__dirname, '../../data/status.json');
        this.status = null;
        this.MAJOR_POWERS = ['ottoman', 'hapsburg', 'england', 'france', 'papacy', 'protestant'];
        this.MINOR_POWERS = ['venice', 'scotland', 'genoa', 'hungary'];
        this.ALL_POWERS = [...this.MAJOR_POWERS, ...this.MINOR_POWERS];
    }

    async initializeGame() {
        const initialStatus = {
            turn: 1,
            phase: 'setup',
            activePlayer: null
        };
        await this.saveStatus(initialStatus);
        return initialStatus;
    }

    async getStatus() {
        try {
            // Return cached status if available
            if (this.status) {
                return this.status;
            }

            const data = await fs.readFile(this.filepath, 'utf8');
            if (!data) {
                return this.initializeGame();
            }
            this.status = JSON.parse(data);
            return this.status;
        } catch (error) {
            if (error.code === 'ENOENT') {
                return this.initializeGame();
            }
            console.error('Error loading game status:', error);
            throw error;
        }
    }

    async saveStatus(status) {
        try {
            await fs.mkdir(path.dirname(this.filepath), { recursive: true });
            await fs.writeFile(this.filepath, JSON.stringify(status, null, FILE_SYSTEM.JSON_INDENT));
            this.status = status;
            return status;
        } catch (error) {
            console.error('Error saving game status:', error);
            throw error;
        }
    }

    async updateStatus(updates) {
        const currentStatus = await this.getStatus();
        const newStatus = { ...currentStatus, ...updates };
        return await this.saveStatus(newStatus);
    }

    async playCard(power, cardId) {
        if (!this.MAJOR_POWERS.includes(power.toLowerCase())) {
            throw new Error('Only major powers can play cards');
        }
        const status = await this.getStatus();
        const turnKey = `turn${status.turn}`;
        status.playedCards[turnKey].push({
            power,
            cardId,
            cardIndex: status.currentCardIndex
        });
        status.currentCardIndex++;
        return await this.saveStatus(status);
    }

    async updateVictoryPoints(power, points) {
        if (!this.MAJOR_POWERS.includes(power.toLowerCase())) {
            throw new Error('Only major powers can have victory points');
        }
        const status = await this.getStatus();
        status.victoryPoints[power.toLowerCase()] += points;
        return await this.saveStatus(status);
    }

    async passPower(power) {
        if (!this.MAJOR_POWERS.includes(power.toLowerCase())) {
            throw new Error('Only major powers can pass');
        }
        const status = await this.getStatus();
        if (!status.passedPowers.includes(power)) {
            status.passedPowers.push(power);
        }
        return await this.saveStatus(status);
    }

    async setActivePlayer(power) {
        if (!this.MAJOR_POWERS.includes(power.toLowerCase())) {
            throw new Error('Only major powers can be active players');
        }
        const status = await this.getStatus();
        status.activePlayer = power;
        return await this.saveStatus(status);
    }

    async nextCard() {
        const status = await this.getStatus();
        status.currentCardIndex++;
        status.passedPowers = [];
        return await this.saveStatus(status);
    }

    async nextTurn() {
        const status = await this.getStatus();
        if (status.turn < 8) {
            status.turn += 1;
            status.currentCardIndex = 0;
            status.passedPowers = [];
            status.activePlayer = null;
        }
        return await this.saveStatus(status);
    }

    async declareWar(power1, power2) {
        const status = await this.getStatus();
        
        // Validate powers
        if (!this.ALL_POWERS.includes(power1.toLowerCase()) || !this.ALL_POWERS.includes(power2.toLowerCase())) {
            throw new Error('Invalid power specified');
        }
        
        power1 = power1.toLowerCase();
        power2 = power2.toLowerCase();
        
        // Remove any existing alliances
        status.diplomacy[power1].alliances = status.diplomacy[power1].alliances.filter(p => p !== power2);
        status.diplomacy[power2].alliances = status.diplomacy[power2].alliances.filter(p => p !== power1);
        
        // Add war status if not already at war
        if (!status.diplomacy[power1].wars.includes(power2)) {
            status.diplomacy[power1].wars.push(power2);
            status.diplomacy[power2].wars.push(power1);
        }
        
        return await this.saveStatus(status);
    }

    async formAlliance(power1, power2) {
        const status = await this.getStatus();
        
        // Validate powers
        if (!this.ALL_POWERS.includes(power1.toLowerCase()) || !this.ALL_POWERS.includes(power2.toLowerCase())) {
            throw new Error('Invalid power specified');
        }
        
        power1 = power1.toLowerCase();
        power2 = power2.toLowerCase();
        
        // Remove any existing wars
        status.diplomacy[power1].wars = status.diplomacy[power1].wars.filter(p => p !== power2);
        status.diplomacy[power2].wars = status.diplomacy[power2].wars.filter(p => p !== power1);
        
        // Add alliance if not already allied
        if (!status.diplomacy[power1].alliances.includes(power2)) {
            status.diplomacy[power1].alliances.push(power2);
            status.diplomacy[power2].alliances.push(power1);
        }
        
        return await this.saveStatus(status);
    }

    async makePeace(power1, power2) {
        const status = await this.getStatus();
        
        // Validate powers
        if (!this.ALL_POWERS.includes(power1.toLowerCase()) || !this.ALL_POWERS.includes(power2.toLowerCase())) {
            throw new Error('Invalid power specified');
        }
        
        power1 = power1.toLowerCase();
        power2 = power2.toLowerCase();
        
        // Remove both war and alliance status
        status.diplomacy[power1].wars = status.diplomacy[power1].wars.filter(p => p !== power2);
        status.diplomacy[power2].wars = status.diplomacy[power2].wars.filter(p => p !== power1);
        status.diplomacy[power1].alliances = status.diplomacy[power1].alliances.filter(p => p !== power2);
        status.diplomacy[power2].alliances = status.diplomacy[power2].alliances.filter(p => p !== power1);
        
        return await this.saveStatus(status);
    }

    async getDiplomaticStatus(power) {
        const status = await this.getStatus();
        
        // Validate power
        if (!this.ALL_POWERS.includes(power.toLowerCase())) {
            throw new Error('Invalid power specified');
        }
        
        return {
            wars: status.diplomacy[power.toLowerCase()].wars,
            alliances: status.diplomacy[power.toLowerCase()].alliances,
            isMinorPower: this.MINOR_POWERS.includes(power.toLowerCase())
        };
    }
}

module.exports = new StatusManager(); 
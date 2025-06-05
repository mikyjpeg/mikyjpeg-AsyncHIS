const fs = require('fs').promises;
const path = require('path');
const spaceManager = require('./spaceManager');
const diplomacyManager = require('./diplomacyManager');
const { FILE_SYSTEM } = require('../utils/constants');
const { getGamePath } = require('../utils/gamePathUtils');

class RulerManager {
    constructor(channelId) {
        if (!channelId) throw new Error('Channel ID is required');
        this.rulersDir = path.join(process.cwd(), getGamePath(channelId), 'rulers');
        this.channelId = channelId;
        this.excommunicatableRulers = ['Calvin', 'Henry VIII', 'Francis I', 'Henry II', 'Charles V'];
        this.excommunicationRules = `Excommunication Rules:
1. Must be a current ruler
2. Must be one of: ${this.excommunicatableRulers.join(', ')}
3. For Henry VIII: Must have at least one non-Catholic English space
4. For all rulers: Must either be:
   - Allied with the Ottoman Empire, or
   - At war with the Papacy`;
    }

    async getRuler(rulerName) {
        try {
            const filePath = path.join(this.rulersDir, `${rulerName.toLowerCase().replace(/\s+/g, '_')}.json`);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            throw new Error(`Ruler "${rulerName}" not found`);
        }
    }

    async getFactionRulers(faction) {
        try {
            const files = await fs.readdir(this.rulersDir);
            const rulers = await Promise.all(
                files
                    .filter(f => f.endsWith('.json'))
                    .map(async f => {
                        const data = await fs.readFile(path.join(this.rulersDir, f), 'utf8');
                        return JSON.parse(data);
                    })
            );
            return rulers.filter(ruler => ruler.faction === faction);
        } catch (error) {
            throw new Error(`Error getting rulers for faction ${faction}: ${error.message}`);
        }
    }

    async updateRuler(rulerName, rulerData) {
        const filePath = path.join(this.rulersDir, `${rulerName.toLowerCase().replace(/\s+/g, '_')}.json`);
        await fs.writeFile(filePath, JSON.stringify(rulerData, null, FILE_SYSTEM.JSON_INDENT));
    }

    async canBeExcommunicated(rulerName) {
        if (!this.excommunicatableRulers.includes(rulerName)) {
            return { 
                valid: false, 
                reason: `${rulerName} cannot be excommunicated. ${this.excommunicationRules}` 
            };
        }

        const ruler = await this.getRuler(rulerName);

        if (!ruler.isCurrentRuler) {
            return {
                valid: false,
                reason: `${rulerName} is not the current ruler and cannot be excommunicated. ${this.excommunicationRules}`
            };
        }

        const faction = ruler.faction;

        if (rulerName === 'Henry VIII') {
            const spaces = await spaceManager(this.channelId).getAllSpaces();
            const hasNonCatholicEnglishSpace = spaces.some(space => 
                space.homePower === 'England' && !space.catholic
            );

            if (hasNonCatholicEnglishSpace) {
                return { 
                    valid: true, 
                    reason: 'England has non-Catholic spaces' 
                };
            }
        }

        const factionData = await diplomacyManager(this.channelId).getFaction(faction);
        if (factionData.alliances.includes('Ottoman')) {
            return { 
                valid: true, 
                reason: `${faction} is allied with the Ottoman Empire` 
            };
        }

        if (factionData.atWarWith.includes('Papacy')) {
            return { 
                valid: true, 
                reason: `${faction} is at war with the Papacy` 
            };
        }

        return { 
            valid: false, 
            reason: `${rulerName} does not meet any conditions for excommunication.\n\n${this.excommunicationRules}` 
        };
    }

    async excommunicate(rulerName) {
        const validation = await this.canBeExcommunicated(rulerName);
        if (!validation.valid) {
            throw new Error(validation.reason);
        }

        const ruler = await this.getRuler(rulerName);
        if (ruler.excommunicated) {
            throw new Error(`${rulerName} is already excommunicated`);
        }

        ruler.excommunicated = true;
        await this.updateRuler(rulerName, ruler);

        const faction = await diplomacyManager(this.channelId).getFaction(ruler.faction);
        faction.cardModifier = (faction.cardModifier || 0) - 1;
        await diplomacyManager(this.channelId).updateFaction(ruler.faction, faction);

        return {
            ruler,
            cardModifierChange: -1,
            newCardModifier: faction.cardModifier
        };
    }

    async removeExcommunication(rulerName) {
        const ruler = await this.getRuler(rulerName);
        if (!ruler.excommunicated) {
            throw new Error(`${rulerName} is not excommunicated`);
        }

        ruler.excommunicated = false;
        await this.updateRuler(rulerName, ruler);

        const faction = await diplomacyManager(this.channelId).getFaction(ruler.faction);
        faction.cardModifier = (faction.cardModifier || 0) + 1;
        await diplomacyManager(this.channelId).updateFaction(ruler.faction, faction);

        return {
            ruler,
            cardModifierChange: 1,
            newCardModifier: faction.cardModifier
        };
    }

    async getAllRulers() {
        try {
            const files = await fs.readdir(this.rulersDir);
            const rulers = await Promise.all(
                files
                    .filter(f => f.endsWith('.json'))
                    .map(async f => {
                        const data = await fs.readFile(path.join(this.rulersDir, f), 'utf8');
                        return JSON.parse(data);
                    })
            );
            return rulers;
        } catch (error) {
            throw new Error(`Error getting all rulers: ${error.message}`);
        }
    }

    async getRulersByPower(power) {
        try {
            const allRulers = await this.getAllRulers();
            return allRulers.filter(ruler => ruler.faction === power);
        } catch (error) {
            throw new Error(`Error getting rulers for power ${power}: ${error.message}`);
        }
    }

    async getCurrentRuler(power) {
        try {
            const rulers = await this.getRulersByPower(power);
            return rulers.find(ruler => ruler.isCurrentRuler);
        } catch (error) {
            throw new Error(`Error getting current ruler for ${power}: ${error.message}`);
        }
    }
}

module.exports = (channelId) => new RulerManager(channelId); 
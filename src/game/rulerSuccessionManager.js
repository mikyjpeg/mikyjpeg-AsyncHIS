const rulerManager = require('./rulerManager');

class RulerSuccessionManager {
    constructor() {
        // Define succession paths for each faction
        this.successionPaths = {
            'England': [
                ['Henry VIII', 'Edward VI'],
                ['Henry VIII', 'Mary I'],
                ['Henry VIII', 'Elizabeth I'],
                ['Mary I', 'Elizabeth I']
            ],
            'Papacy': [
                ['Leo X', 'Clement VII'],
                ['Clement VII', 'Paul III'],
                ['Paul III', 'Julius III']
            ],
            'France': [
                ['Francis I', 'Henry II']
            ],
            'Protestant': [
                ['Martin Luther', 'Calvin']
            ]
        };
    }

    async getCurrentRuler(faction) {
        try {
            // Get all rulers for the faction
            const rulers = await rulerManager.getFactionRulers(faction);
            const currentRuler = rulers.find(ruler => ruler.isCurrentRuler);
            
            if (!currentRuler) {
                throw new Error(`No current ruler found for ${faction}`);
            }
            
            return currentRuler;
        } catch (error) {
            throw new Error(`Error getting current ruler for ${faction}: ${error.message}`);
        }
    }

    async getNextRuler(faction, currentRulerName) {
        const successionPaths = this.successionPaths[faction];
        if (!successionPaths) {
            throw new Error(`No succession path defined for faction: ${faction}`);
        }

        // Find the succession path that starts with the current ruler
        const validPath = successionPaths.find(path => path[0] === currentRulerName);
        if (!validPath) {
            throw new Error(`No valid succession path found for ${currentRulerName} in ${faction}`);
        }

        // Return the next ruler in the path
        return validPath[1];
    }

    async changeRuler(faction) {
        try {
            // Get current ruler
            const currentRuler = await this.getCurrentRuler(faction);
            
            // Get next ruler name
            const nextRulerName = await this.getNextRuler(faction, currentRuler.name);
            
            // Update current ruler's status
            currentRuler.isCurrentRuler = false;
            await rulerManager.updateRuler(currentRuler.name, currentRuler);
            
            // Update new ruler's status
            const nextRuler = await rulerManager.getRuler(nextRulerName);
            nextRuler.isCurrentRuler = true;
            await rulerManager.updateRuler(nextRulerName, nextRuler);

            return {
                oldRuler: currentRuler,
                newRuler: nextRuler
            };
        } catch (error) {
            throw new Error(`Failed to change ruler for ${faction}: ${error.message}`);
        }
    }

    isValidFaction(faction) {
        return faction in this.successionPaths;
    }

    getValidFactions() {
        return Object.keys(this.successionPaths);
    }
}

module.exports = new RulerSuccessionManager(); 
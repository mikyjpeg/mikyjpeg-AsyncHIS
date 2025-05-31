const rulerManager = require('./rulerManager');

class RulerSuccessionManager {
    constructor() {
        // Define succession paths for each faction
        this.successionPaths = {
            'England': [
                ['Henry VIII', 'Edward VI'],
                ['Henry VIII', 'Mary I'],
                ['Edward VI', 'Mary I'],
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

        // Define factions that require explicit successor specification
        this.factionsRequiringSuccessor = ['England'];
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

    requiresSuccessorSpecification(faction) {
        return this.factionsRequiringSuccessor.includes(faction);
    }

    async getValidSuccessors(faction, currentRulerName) {
        const successionPaths = this.successionPaths[faction];
        if (!successionPaths) {
            throw new Error(`No succession path defined for faction: ${faction}`);
        }

        // Find all succession paths that start with the current ruler
        const validPaths = successionPaths.filter(path => path[0] === currentRulerName);
        if (validPaths.length === 0) {
            throw new Error(`No valid succession paths found for ${currentRulerName} in ${faction}`);
        }

        // Return array of possible successors
        return validPaths.map(path => path[1]);
    }

    async validateSuccession(faction, currentRulerName, newRulerName) {
        const validPaths = this.successionPaths[faction];
        if (!validPaths) {
            throw new Error(`No succession path defined for faction: ${faction}`);
        }

        const isValidPath = validPaths.some(
            path => path[0] === currentRulerName && path[1] === newRulerName
        );

        if (!isValidPath) {
            const validSuccessors = await this.getValidSuccessors(faction, currentRulerName);
            throw new Error(
                `Invalid succession path. ${currentRulerName} can only be succeeded by: ${validSuccessors.join(', ')}`
            );
        }

        return true;
    }

    async getNextRuler(faction, currentRulerName, specifiedSuccessor = null) {
        const successionPaths = this.successionPaths[faction];
        if (!successionPaths) {
            throw new Error(`No succession path defined for faction: ${faction}`);
        }

        if (this.requiresSuccessorSpecification(faction)) {
            if (!specifiedSuccessor) {
                const validSuccessors = await this.getValidSuccessors(faction, currentRulerName);
                throw new Error(
                    `For ${faction}, you must specify the successor. Valid successors for ${currentRulerName} are: ${validSuccessors.join(', ')}`
                );
            }
            // Validate the specified successor
            await this.validateSuccession(faction, currentRulerName, specifiedSuccessor);
            return specifiedSuccessor;
        }

        // For other factions, use the automatic succession
        const validPath = successionPaths.find(path => path[0] === currentRulerName);
        if (!validPath) {
            throw new Error(`No valid succession path found for ${currentRulerName} in ${faction}`);
        }

        return validPath[1];
    }

    async changeRuler(faction, specifiedSuccessor = null) {
        try {
            // Get current ruler
            const currentRuler = await this.getCurrentRuler(faction);
            
            // Get next ruler name
            const nextRulerName = await this.getNextRuler(faction, currentRuler.name, specifiedSuccessor);
            
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
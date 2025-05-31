const spaceManager = require('./spaceManager');

class FormationManager {
    constructor() {
        this.validPowers = ['Protestant', 'Ottoman', 'Hapsburg', 'England', 'France', 'Papacy'];
    }

    validateFormation(formation) {
        if (!formation.power || !this.validPowers.includes(formation.power)) {
            throw new Error(`Invalid power. Must be one of: ${this.validPowers.join(', ')}`);
        }

        if (typeof formation.troops !== 'number' || formation.troops < 0) {
            throw new Error('Troops must be a non-negative number');
        }

        if (!Array.isArray(formation.leaders)) {
            throw new Error('Leaders must be an array');
        }
    }

    async addFormation(spaceName, power, troops, leaders = []) {
        const space = await spaceManager.getSpace(spaceName);
        
        const formation = {
            power,
            troops,
            leaders: leaders || []
        };

        // Validate the formation
        this.validateFormation(formation);

        // Check if a formation for this power already exists
        const existingIndex = space.formations.findIndex(f => f.power === power);
        if (existingIndex !== -1) {
            // Add troops to existing formation
            space.formations[existingIndex].troops += troops;
            // Add any new leaders
            space.formations[existingIndex].leaders = [
                ...new Set([...space.formations[existingIndex].leaders, ...leaders])
            ];
        } else {
            // Add new formation
            space.formations.push(formation);
        }

        // Update the space
        await spaceManager.updateSpace(spaceName, space);
        return space;
    }

    async removeFormation(spaceName, power, troops, leaders = []) {
        const space = await spaceManager.getSpace(spaceName);
        
        // Find the formation for this power
        const formationIndex = space.formations.findIndex(f => f.power === power);
        if (formationIndex === -1) {
            throw new Error(`No formation found for ${power} in ${spaceName}`);
        }

        const formation = space.formations[formationIndex];

        // Validate troop removal
        if (troops > formation.troops) {
            throw new Error(`Cannot remove ${troops} troops. Formation only has ${formation.troops} troops`);
        }

        // Validate leader removal
        for (const leader of leaders) {
            if (!formation.leaders.includes(leader)) {
                throw new Error(`Leader ${leader} not found in formation`);
            }
        }

        // Update troops
        formation.troops -= troops;

        // Remove specified leaders
        formation.leaders = formation.leaders.filter(l => !leaders.includes(l));

        // If no troops and no leaders remain, remove the formation entirely
        if (formation.troops === 0 && formation.leaders.length === 0) {
            space.formations.splice(formationIndex, 1);
        } else {
            space.formations[formationIndex] = formation;
        }

        // Update the space
        await spaceManager.updateSpace(spaceName, space);
        return space;
    }

    async getFormations(spaceName) {
        const space = await spaceManager.getSpace(spaceName);
        return space.formations;
    }
}

module.exports = new FormationManager(); 
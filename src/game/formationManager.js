const spaceManager = require('./spaceManager');
const leaderManager = require('./leaderManager');

class FormationManager {
    constructor() {
        this.validPowers = ['Protestant', 'Ottoman', 'Hapsburg', 'England', 'France', 'Papacy'];
    }

    validateFormation(formation) {
        if (!formation.power || !this.validPowers.includes(formation.power)) {
            throw new Error(`Invalid power. Must be one of: ${this.validPowers.join(', ')}`);
        }

        if (!Array.isArray(formation.leaders)) {
            throw new Error('Leaders must be an array');
        }

        // Validate troop numbers
        if (typeof formation.regulars !== 'number' || formation.regulars < 0) {
            throw new Error('Regular troops must be a non-negative number');
        }

        // Ottoman-specific validation
        if (formation.power === 'Ottoman') {
            if (typeof formation.cavalry !== 'number' || formation.cavalry < 0) {
                throw new Error('Cavalry must be a non-negative number for Ottoman');
            }
            if (formation.mercenaries !== undefined && formation.mercenaries !== 0) {
                throw new Error('Ottoman cannot have mercenaries');
            }
        } else {
            // Non-Ottoman validation
            if (typeof formation.mercenaries !== 'number' || formation.mercenaries < 0) {
                throw new Error('Mercenary troops must be a non-negative number');
            }
            if (formation.cavalry !== undefined && formation.cavalry !== 0) {
                throw new Error('Only Ottoman can have cavalry');
            }
        }
    }

    async validateLeaders(power, leaders) {
        for (const leaderName of leaders) {
            const leader = await leaderManager.getLeader(leaderName);
            
            // Check if leader belongs to the power
            if (leader.power !== power) {
                throw new Error(`Leader ${leaderName} belongs to ${leader.power}, not ${power}`);
            }

            // Check if leader is active
            if (!leader.isActive) {
                throw new Error(`Leader ${leaderName} is not active`);
            }

            // Check if leader is captured
            if (leader.isCaptured) {
                throw new Error(`Leader ${leaderName} is currently captured`);
            }
        }
    }

    async addFormation(spaceName, power, regularTroops, secondaryTroops, leaders = []) {
        const space = await spaceManager.getSpace(spaceName);
        
        const formation = {
            power,
            regulars: regularTroops,
            mercenaries: power === 'Ottoman' ? 0 : secondaryTroops,
            cavalry: power === 'Ottoman' ? secondaryTroops : 0,
            leaders: leaders || []
        };

        // Validate the formation structure
        this.validateFormation(formation);

        // Validate leaders belong to power and are active
        await this.validateLeaders(power, leaders);

        // Check if a formation for this power already exists
        const existingIndex = space.formations.findIndex(f => f.power === power);
        if (existingIndex !== -1) {
            // Add troops to existing formation
            space.formations[existingIndex].regulars += formation.regulars;
            if (power === 'Ottoman') {
                space.formations[existingIndex].cavalry += formation.cavalry;
            } else {
                space.formations[existingIndex].mercenaries += formation.mercenaries;
            }
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

    async removeFormation(spaceName, power, regularTroops, secondaryTroops, leaders = []) {
        const space = await spaceManager.getSpace(spaceName);
        
        // Find the formation for this power
        const formationIndex = space.formations.findIndex(f => f.power === power);
        if (formationIndex === -1) {
            throw new Error(`No formation found for ${power} in ${spaceName}`);
        }

        const formation = space.formations[formationIndex];

        // Validate troop removal
        if (regularTroops > formation.regulars) {
            throw new Error(`Cannot remove ${regularTroops} regular troops. Formation only has ${formation.regulars} regular troops`);
        }

        if (power === 'Ottoman') {
            if (secondaryTroops > formation.cavalry) {
                throw new Error(`Cannot remove ${secondaryTroops} cavalry. Formation only has ${formation.cavalry} cavalry`);
            }
        } else {
            if (secondaryTroops > formation.mercenaries) {
                throw new Error(`Cannot remove ${secondaryTroops} mercenaries. Formation only has ${formation.mercenaries} mercenaries`);
            }
        }

        // Validate leaders belong to power and exist in formation
        await this.validateLeaders(power, leaders);
        for (const leader of leaders) {
            if (!formation.leaders.includes(leader)) {
                throw new Error(`Leader ${leader} not found in formation at ${spaceName}`);
            }
        }

        // Update troops
        formation.regulars -= regularTroops;
        if (power === 'Ottoman') {
            formation.cavalry -= secondaryTroops;
        } else {
            formation.mercenaries -= secondaryTroops;
        }

        // Remove specified leaders
        formation.leaders = formation.leaders.filter(l => !leaders.includes(l));

        // If no troops and no leaders remain, remove the formation entirely
        if (formation.regulars === 0 && 
            (power === 'Ottoman' ? formation.cavalry === 0 : formation.mercenaries === 0) && 
            formation.leaders.length === 0) {
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
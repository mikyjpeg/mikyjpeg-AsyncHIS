const spaceManager = require('./spaceManager');
const diplomacyManager = require('./diplomacyManager');

class NavalManager {
    constructor(channelId) {
        if (!channelId) throw new Error('Channel ID is required');
        this.channelId = channelId;
        this.validPowers = ['Ottoman', 'Hapsburg', 'England', 'France', 'Papacy', 'Protestant', 'Venice', 'Genoa', 'Scotland'];
    }

    async validateSquadron(squadron) {
        // Validate power
        if (!squadron.power || !this.validPowers.includes(squadron.power)) {
            throw new Error(`Invalid power. Must be one of: ${this.validPowers.join(', ')}`);
        }

        // Validate squadron number or corsair number
        if (squadron.squadron !== undefined) {
            if (typeof squadron.squadron !== 'number' || squadron.squadron <= 0) {
                throw new Error('Squadron must be a positive number');
            }
        } else if (squadron.corsair !== undefined) {
            if (squadron.power !== 'Ottoman') {
                throw new Error('Only Ottoman can have corsairs');
            }
            if (typeof squadron.corsair !== 'number' || squadron.corsair <= 0) {
                throw new Error('Corsair must be a positive number');
            }
        } else {
            throw new Error('Squadron must have either squadron or corsair field');
        }

        // Validate loans array if present
        if (squadron.loans) {
            if (!Array.isArray(squadron.loans)) {
                throw new Error('Loans must be an array');
            }
            
            const dm = diplomacyManager(this.channelId);
            const receivingFaction = await dm.getFaction(squadron.power);

            for (const loan of squadron.loans) {
                if (!loan.power || !this.validPowers.includes(loan.power)) {
                    throw new Error(`Invalid loaning power. Must be one of: ${this.validPowers.join(', ')}`);
                }
                if (loan.power === squadron.power) {
                    throw new Error('A power cannot loan squadrons to itself');
                }
                if (typeof loan.squadron !== 'number' || loan.squadron <= 0) {
                    throw new Error('Loaned squadron must be a positive number');
                }

                // Check if the loaning power is allied with the receiving power
                if (!receivingFaction.alliances.includes(loan.power)) {
                    throw new Error(`${loan.power} must be allied with ${squadron.power} to loan squadrons`);
                }
            }
        }
    }

    async addSquadronToPort(spaceName, squadron) {
        const sm = spaceManager(this.channelId);
        const space = await sm.getSpace(spaceName);

        // Validate space has ports
        if (!space.hasPorts) {
            throw new Error(`${spaceName} does not have ports`);
        }

        // Validate squadron structure
        await this.validateSquadron(squadron);

        // Add squadron to space
        if (!space.squadrons) {
            space.squadrons = [];
        }

        // Check if there's already a squadron for this power
        const existingIndex = space.squadrons.findIndex(s => s.power === squadron.power);

        if (existingIndex !== -1) {
            // Add to existing squadron/corsair count
            if (squadron.squadron !== undefined) {
                space.squadrons[existingIndex].squadron = (space.squadrons[existingIndex].squadron || 0) + squadron.squadron;
            }
            if (squadron.corsair !== undefined) {
                space.squadrons[existingIndex].corsair = (space.squadrons[existingIndex].corsair || 0) + squadron.corsair;
            }

            // Handle loans
            if (squadron.loans && squadron.loans.length > 0) {
                if (!space.squadrons[existingIndex].loans) {
                    space.squadrons[existingIndex].loans = [];
                }

                for (const newLoan of squadron.loans) {
                    const existingLoanIndex = space.squadrons[existingIndex].loans.findIndex(
                        l => l.power === newLoan.power
                    );

                    if (existingLoanIndex !== -1) {
                        // Add to existing loan
                        space.squadrons[existingIndex].loans[existingLoanIndex].squadron += newLoan.squadron;
                    } else {
                        // Add new loan
                        space.squadrons[existingIndex].loans.push({
                            power: newLoan.power,
                            squadron: newLoan.squadron
                        });
                    }
                }
            }
        } else {
            // Add new squadron entry
            const newSquadron = {
                power: squadron.power,
                loans: squadron.loans || []
            };
            if (squadron.squadron !== undefined) {
                newSquadron.squadron = squadron.squadron;
            }
            if (squadron.corsair !== undefined) {
                newSquadron.corsair = squadron.corsair;
            }
            space.squadrons.push(newSquadron);
        }

        // Update the space
        await sm.updateSpace(spaceName, space);
        return space;
    }

    async removeSquadronFromPort(spaceName, squadron) {
        const sm = spaceManager(this.channelId);
        const space = await sm.getSpace(spaceName);

        // Find the squadron
        const squadronIndex = space.squadrons.findIndex(s => s.power === squadron.power);

        if (squadronIndex === -1) {
            throw new Error(`No matching squadron found in ${spaceName}`);
        }

        const existingSquadron = space.squadrons[squadronIndex];

        // Validate we can remove the requested number
        if (squadron.squadron !== undefined) {
            if (!existingSquadron.squadron || squadron.squadron > existingSquadron.squadron) {
                throw new Error(`Cannot remove ${squadron.squadron} squadrons. Only ${existingSquadron.squadron || 0} available`);
            }
        }
        if (squadron.corsair !== undefined) {
            if (!existingSquadron.corsair || squadron.corsair > existingSquadron.corsair) {
                throw new Error(`Cannot remove ${squadron.corsair} corsairs. Only ${existingSquadron.corsair || 0} available`);
            }
        }

        // Handle loans removal if present
        if (squadron.loans && squadron.loans.length > 0) {
            if (!existingSquadron.loans) {
                throw new Error('Cannot remove loans from a squadron that has no loans');
            }

            for (const loanToRemove of squadron.loans) {
                const existingLoanIndex = existingSquadron.loans.findIndex(
                    l => l.power === loanToRemove.power
                );

                if (existingLoanIndex === -1) {
                    throw new Error(`No loan found from power ${loanToRemove.power}`);
                }

                const existingLoan = existingSquadron.loans[existingLoanIndex];
                if (loanToRemove.squadron > existingLoan.squadron) {
                    throw new Error(`Cannot remove ${loanToRemove.squadron} loaned squadrons from ${loanToRemove.power}. Only ${existingLoan.squadron} available`);
                }

                if (loanToRemove.squadron === existingLoan.squadron) {
                    // Remove the entire loan entry
                    existingSquadron.loans.splice(existingLoanIndex, 1);
                } else {
                    // Reduce the loan count
                    existingLoan.squadron -= loanToRemove.squadron;
                }
            }
        }

        // Update or remove the squadron
        if ((squadron.squadron === existingSquadron.squadron || !existingSquadron.squadron) &&
            (squadron.corsair === existingSquadron.corsair || !existingSquadron.corsair) &&
            (!existingSquadron.loans || existingSquadron.loans.length === 0)) {
            space.squadrons.splice(squadronIndex, 1);
        } else {
            if (squadron.squadron !== undefined) {
                existingSquadron.squadron -= squadron.squadron;
            }
            if (squadron.corsair !== undefined) {
                existingSquadron.corsair -= squadron.corsair;
            }
        }

        // Update the space
        await sm.updateSpace(spaceName, space);
        return space;
    }
}

module.exports = (channelId) => new NavalManager(channelId); 
const ALLIANCE_RULES = {
    Genoa: {
        possibleAllies: ['France', 'Hapsburg', 'Papacy'],
        canRemoveAlliance: true
    },
    Hungary: {
        possibleAllies: ['Hapsburg'],
        canRemoveAlliance: false
    },
    Scotland: {
        possibleAllies: ['France', 'England'],
        canRemoveAlliance: true
    },
    Venice: {
        possibleAllies: ['France', 'Hapsburg', 'Papacy'],
        canRemoveAlliance: true
    }
};

const MAJOR_POWERS = ['Ottoman', 'Hapsburg', 'England', 'France', 'Papacy', 'Protestant'];
const MINOR_POWERS = ['Venice', 'Genoa', 'Hungary', 'Scotland'];

function validateAlliance(power1, power2) {
    // If both are major powers, alliance is allowed
    if (MAJOR_POWERS.includes(power1) && MAJOR_POWERS.includes(power2)) {
        return { valid: true };
    }

    // If neither is a major power, alliance is not allowed
    if (!MAJOR_POWERS.includes(power1) && !MAJOR_POWERS.includes(power2)) {
        return { valid: false, reason: 'Minor powers cannot form alliances with each other' };
    }

    // Get the minor power (if any)
    const minorPower = MINOR_POWERS.includes(power1) ? power1 : power2;
    const majorPower = MINOR_POWERS.includes(power1) ? power2 : power1;

    // Check if minor power has alliance rules
    if (!ALLIANCE_RULES[minorPower]) {
        return { valid: false, reason: `No alliance rules defined for ${minorPower}` };
    }

    // Check if alliance is allowed
    if (!ALLIANCE_RULES[minorPower].possibleAllies.includes(majorPower)) {
        return { valid: false, reason: `${minorPower} cannot form an alliance with ${majorPower}` };
    }

    return { valid: true };
}

function canRemoveAlliance(power) {
    // Major powers can always remove alliances
    if (MAJOR_POWERS.includes(power)) {
        return true;
    }

    // Check minor power rules
    return ALLIANCE_RULES[power]?.canRemoveAlliance ?? true;
}

module.exports = {
    validateAlliance,
    canRemoveAlliance,
    MAJOR_POWERS,
    MINOR_POWERS
}; 
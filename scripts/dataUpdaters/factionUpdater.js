const fs = require('fs').promises;
const path = require('path');

async function updateFactions() {
    try {
        const factionsDir = path.join(__dirname, '../../data/factions');
        const files = await fs.readdir(factionsDir);

        for (const file of files) {
            if (!file.endsWith('.json')) continue;

            const filePath = path.join(factionsDir, file);
            const data = await fs.readFile(filePath, 'utf8');
            const faction = JSON.parse(data);

            // Add new fields if they don't exist
            const updatedFaction = {
                ...faction,
                captiveLeaders: faction.captiveLeaders || [],
                cardModifier: faction.cardModifier || 0,
                bonusVP: faction.bonusVP || [],
                bonusVPTotal: faction.bonusVPTotal || 0
            };

            // Write back the updated faction
            await fs.writeFile(filePath, JSON.stringify(updatedFaction, null, 2));
            console.log(`Updated ${file}`);
        }

        console.log('All faction files updated successfully!');
    } catch (error) {
        console.error('Error updating faction files:', error);
        throw error;
    }
}

module.exports = { updateFactions }; 
const fs = require('fs').promises;
const path = require('path');

async function updateFactions() {
    const factionsDir = path.join(__dirname, '../../data/factions');
    
    try {
        const files = await fs.readdir(factionsDir);
        
        for (const file of files) {
            if (!file.endsWith('.json')) continue;
            
            const filePath = path.join(factionsDir, file);
            const factionData = JSON.parse(await fs.readFile(filePath, 'utf8'));
            
            // Add cardModifier field (default: 0)
            if (!factionData.hasOwnProperty('cardModifier')) {
                factionData.cardModifier = 0;
            }
            
            // Add bonusVP field (default: empty array)
            if (!factionData.hasOwnProperty('bonusVP')) {
                factionData.bonusVP = [];
            }

            // Add bonusVPTotal field (default: 0)
            if (!factionData.hasOwnProperty('bonusVPTotal')) {
                factionData.bonusVPTotal = 0;
            }
            
            // Write back the updated data
            await fs.writeFile(filePath, JSON.stringify(factionData, null, 2));
            console.log(`Updated ${file}`);
        }
        
        console.log('All faction files have been updated successfully');
    } catch (error) {
        console.error('Error updating factions:', error);
        throw error;
    }
}

module.exports = { updateFactions }; 
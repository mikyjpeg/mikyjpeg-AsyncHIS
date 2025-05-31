const fs = require('fs').promises;
const path = require('path');

async function updateSpaces() {
    const spacesDir = path.join(__dirname, '../../data/spaces');
    
    try {
        const files = await fs.readdir(spacesDir);
        
        for (const file of files) {
            if (!file.endsWith('.json')) continue;
            
            const filePath = path.join(spacesDir, file);
            const spaceData = JSON.parse(await fs.readFile(filePath, 'utf8'));
            
            // Add jesuiteUniversity field (default: false)
            if (!spaceData.hasOwnProperty('jesuiteUniversity')) {
                spaceData.jesuiteUniversity = false;
            }
            
            // Add catholic field (default: true) only for non-Ottoman and non-Mixed spaces
            if (!spaceData.hasOwnProperty('catholic') && 
                spaceData.homePower !== 'Ottoman' && 
                spaceData.homePower !== 'Mixed') {
                spaceData.catholic = true;
            }

            // Add reformers field (empty array)
            if (!spaceData.hasOwnProperty('reformers')) {
                spaceData.reformers = [];
            }
            
            // Write back the updated data
            await fs.writeFile(filePath, JSON.stringify(spaceData, null, 2));
            console.log(`Updated ${file}`);
        }
        
        console.log('All space files have been updated successfully');
    } catch (error) {
        console.error('Error updating spaces:', error);
        throw error;
    }
}

module.exports = { updateSpaces }; 
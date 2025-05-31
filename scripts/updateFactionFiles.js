const fs = require('fs').promises;
const path = require('path');

async function updateFactionFiles() {
    try {
        const factionsDir = path.join(__dirname, '../data/factions');
        const files = await fs.readdir(factionsDir);

        for (const file of files) {
            if (!file.endsWith('.json')) continue;

            const filePath = path.join(factionsDir, file);
            const data = JSON.parse(await fs.readFile(filePath, 'utf8'));

            // Add new fields if they don't exist
            if (!data.alliances) {
                data.alliances = [];
            }
            if (!data.atWarWith) {
                data.atWarWith = [];
            }

            // Write back the updated data
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            console.log(`Updated faction file: ${file}`);
        }

        console.log('All faction files have been updated successfully!');
    } catch (error) {
        console.error('Error updating faction files:', error);
    }
}

updateFactionFiles(); 
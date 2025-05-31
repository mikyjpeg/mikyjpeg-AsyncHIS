const fs = require('fs').promises;
const path = require('path');

async function migrateSeaZoneFiles() {
    try {
        const seazonesDir = path.join(__dirname, '../data/seazones');
        const files = await fs.readdir(seazonesDir);

        for (const file of files) {
            if (!file.endsWith('.json')) continue;

            const filePath = path.join(seazonesDir, file);
            const data = JSON.parse(await fs.readFile(filePath, 'utf8'));

            // Rename the field while preserving its value
            data.ports = data.adjacentPorts;
            delete data.adjacentPorts;

            // Write back the updated data
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            console.log(`Updated sea zone file: ${file}`);
        }

        console.log('All sea zone files have been updated successfully!');
    } catch (error) {
        console.error('Error updating sea zone files:', error);
    }
}

migrateSeaZoneFiles(); 
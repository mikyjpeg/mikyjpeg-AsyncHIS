const fs = require('fs').promises;
const path = require('path');

async function updateSpaceFormations() {
    try {
        const spacesDir = path.join(__dirname, '../../data/spaces');
        const files = await fs.readdir(spacesDir);

        for (const file of files) {
            if (!file.endsWith('.json')) continue;

            const filePath = path.join(spacesDir, file);
            const data = await fs.readFile(filePath, 'utf8');
            const space = JSON.parse(data);

            // Remove old fields and add new formations array if it doesn't exist
            const { troops, leaders, ...restSpace } = space;
            const updatedSpace = {
                ...restSpace,
                formations: space.formations || []
            };

            // Write back the updated space
            await fs.writeFile(filePath, JSON.stringify(updatedSpace, null, 2));
            console.log(`Updated ${file}`);
        }

        console.log('All space files updated with formations array');
    } catch (error) {
        console.error('Error updating space formations:', error);
        throw error;
    }
}

module.exports = { updateSpaceFormations }; 
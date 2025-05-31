const fs = require('fs').promises;
const path = require('path');

async function updateSpaceFiles() {
    const spacesDir = path.join(__dirname, '../../data/spaces');
    const files = await fs.readdir(spacesDir);

    for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(spacesDir, file);
        const data = await fs.readFile(filePath, 'utf8');
        const space = JSON.parse(data);

        // Remove old fields and add new formations array
        const { troops, leaders, ...restSpace } = space;
        const updatedSpace = {
            ...restSpace,
            formations: []
        };

        // Write back the updated space
        await fs.writeFile(filePath, JSON.stringify(updatedSpace, null, 2));
        console.log(`Updated ${file}`);
    }
}

updateSpaceFiles().catch(console.error); 
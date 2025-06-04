const fs = require('fs').promises;
const path = require('path');

async function addUnderSiegeField() {
    const spacesDir = path.join(process.cwd(), 'data', 'spaces');
    const files = await fs.readdir(spacesDir);
    let modifiedCount = 0;

    for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(spacesDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const space = JSON.parse(content);

        // Check if space is a fortress or key
        if (space.type === 'fortress' || space.type === 'key') {
            // Only add if not already present
            if (space.isUnderSiege === undefined) {
                space.isUnderSiege = false;
                await fs.writeFile(filePath, JSON.stringify(space, null, 2));
                console.log(`Added isUnderSiege field to ${space.name}`);
                modifiedCount++;
            }
        }
    }

    console.log(`\nModified ${modifiedCount} spaces`);
}

addUnderSiegeField().catch(console.error); 
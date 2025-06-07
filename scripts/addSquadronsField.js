const fs = require('fs').promises;
const path = require('path');

async function addSquadronsField(spacesDir) {
    try {
        // Read all files in the spaces directory
        const files = await fs.readdir(spacesDir);

        for (const file of files) {
            if (!file.endsWith('.json')) continue;

            const filePath = path.join(spacesDir, file);
            const data = await fs.readFile(filePath, 'utf8');
            const space = JSON.parse(data);

            // Only add squadrons field to spaces with hasPorts=true
            if (space.hasPorts === true && !space.squadrons) {
                space.squadrons = [];
                await fs.writeFile(filePath, JSON.stringify(space, null, 2));
                console.log(`Added squadrons field to ${file}`);
            }
        }
    } catch (error) {
        console.error(`Error processing directory ${spacesDir}:`, error);
    }
}

async function main() {
    // Process both directories
    const templateDir = path.join(__dirname, '../data/game_template/spaces');
    const gameDir = path.join(__dirname, '../data/games/630e06e0/spaces');

    console.log('Processing template spaces...');
    await addSquadronsField(templateDir);
    
    console.log('\nProcessing game spaces...');
    await addSquadronsField(gameDir);
    
    console.log('\nDone!');
}

main().catch(console.error); 
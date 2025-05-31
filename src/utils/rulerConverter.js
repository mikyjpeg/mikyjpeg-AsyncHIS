const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parse');

async function convertRulers() {
    const csvPath = path.join(__dirname, '../../resources/rulers.csv');
    const outputDir = path.join(__dirname, '../../data/rulers');
    
    try {
        // Read CSV file
        const csvContent = await fs.readFile(csvPath, 'utf8');
        
        // Parse CSV
        const records = await new Promise((resolve, reject) => {
            csv.parse(csvContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            }, (err, records) => {
                if (err) reject(err);
                else resolve(records);
            });
        });

        // Create output directory if it doesn't exist
        await fs.mkdir(outputDir, { recursive: true });

        // Process each ruler
        for (const record of records) {
            const rulerData = {
                name: record.name,
                faction: record.faction,
                battleRating: parseInt(record.battleRating) || 0,
                commandRating: parseInt(record.CommandRating) || 0,
                adminRating: parseInt(record.adminRating) || 0,
                cardBonus: parseInt(record.cardBonus) || 0,
                isCurrentRuler: record.isCurrentRuler === 'true',
                excommunicated: record.excommunicated === 'true',
                otherinfo: record.otherinfo || null
            };

            // Create filename from name (lowercase, replace spaces with underscores)
            const filename = `${rulerData.name.toLowerCase().replace(/\s+/g, '_')}.json`;
            const filePath = path.join(outputDir, filename);

            // Write ruler data to JSON file
            await fs.writeFile(filePath, JSON.stringify(rulerData, null, 2));
            console.log(`Created ruler file: ${filename}`);
        }

        console.log('All ruler files have been created successfully');
    } catch (error) {
        console.error('Error converting rulers:', error);
        throw error;
    }
}

module.exports = { convertRulers }; 
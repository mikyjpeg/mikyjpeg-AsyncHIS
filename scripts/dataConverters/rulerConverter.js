const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parse/sync');

async function convertRulers() {
    try {
        // Read the CSV file
        const csvData = await fs.readFile(path.join(__dirname, '../../resources/rulers.csv'), 'utf8');
        
        // Parse CSV data
        const records = csv.parse(csvData, {
            columns: true,
            skip_empty_lines: true
        });

        // Create rulers directory if it doesn't exist
        const rulersDir = path.join(__dirname, '../../data/rulers');
        await fs.mkdir(rulersDir, { recursive: true });

        // Convert each record to JSON and save as individual file
        for (const record of records) {
            // Convert string 'true'/'false' to boolean
            record.isActive = record.isActive === 'true';
            
            // Create filename from ruler name (replace spaces with underscores and lowercase)
            const filename = `${record.name.toLowerCase().replace(/\s+/g, '_')}.json`;
            const filePath = path.join(rulersDir, filename);

            // Write the JSON file
            await fs.writeFile(filePath, JSON.stringify(record, null, 2));
            console.log(`Created ${filename}`);
        }

        console.log('Ruler data conversion completed successfully!');
    } catch (error) {
        console.error('Error converting ruler data:', error);
        throw error;
    }
}

module.exports = { convertRulers }; 
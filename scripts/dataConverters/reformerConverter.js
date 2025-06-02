const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parse/sync');

async function convertReformers() {
    try {
        // Read the CSV file
        const csvData = await fs.readFile(path.join(__dirname, '../../resources/reformers.csv'), 'utf8');
        
        // Parse CSV data
        const records = csv.parse(csvData, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        // Create reformers directory if it doesn't exist
        const reformersDir = path.join(__dirname, '../../data/reformers');
        await fs.mkdir(reformersDir, { recursive: true });

        // Convert each record to JSON and save as individual file
        for (const record of records) {
            // Clean up the record
            const cleanRecord = {
                name: record.name,
                location: record.location,
                turn: parseInt(record.turn),
                isActive: false,
                isExcommunicated: false
            };

            // Create filename from reformer name (replace spaces with underscores and lowercase)
            const filename = `${record.name.toLowerCase().replace(/\s+/g, '_')}.json`;
            const filePath = path.join(reformersDir, filename);

            // Write the JSON file
            await fs.writeFile(filePath, JSON.stringify(cleanRecord, null, 2));
            console.log(`Created ${filename}`);
        }

        console.log('Reformer data conversion completed successfully!');
    } catch (error) {
        console.error('Error converting reformer data:', error);
        throw error;
    }
}

module.exports = { convertReformers }; 
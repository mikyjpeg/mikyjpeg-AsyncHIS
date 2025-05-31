const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parse/sync');

async function convertLeadersData() {
    try {
        // Read the CSV file
        const csvData = await fs.readFile(path.join(__dirname, '../../resources/leaders.csv'), 'utf8');
        
        // Parse CSV data
        const records = csv.parse(csvData, {
            columns: true,
            skip_empty_lines: true
        });

        // Create leaders directory if it doesn't exist
        const leadersDir = path.join(__dirname, '../../data/leaders');
        await fs.mkdir(leadersDir, { recursive: true });

        // Convert each record to JSON and save as individual file
        for (const record of records) {
            // Convert string 'true'/'false' to boolean
            record.isCaptured = record.isCaptured === 'true';
            record.isActive = record.isActive === 'true';
            
            // Convert numeric strings to numbers
            record.battleRating = parseInt(record.battleRating);
            record.commandRating = parseInt(record.commandRating);

            // Create filename from leader name (replace spaces with underscores and lowercase)
            const filename = `${record.name.toLowerCase().replace(/\s+/g, '_')}.json`;
            const filePath = path.join(leadersDir, filename);

            // Write the JSON file
            await fs.writeFile(filePath, JSON.stringify(record, null, 2));
            console.log(`Created ${filename}`);
        }

        console.log('Leader data conversion completed successfully!');
    } catch (error) {
        console.error('Error converting leader data:', error);
    }
}

convertLeadersData(); 
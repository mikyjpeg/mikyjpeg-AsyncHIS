const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parse/sync');

async function convertDebaters() {
    try {
        // Read the CSV file
        const csvData = await fs.readFile(path.join(__dirname, '../../resources/debaters.csv'), 'utf8');
        
        // Parse CSV data with relaxed parsing
        const records = csv.parse(csvData, {
            columns: true,
            skip_empty_lines: true,
            relax_column_count: true,  // Allow varying column counts
            relax_quotes: true,        // Be more forgiving with quotes
            trim: true                 // Trim whitespace from values
        });

        // Create debaters directory if it doesn't exist
        const debatersDir = path.join(__dirname, '../../data/debaters');
        await fs.mkdir(debatersDir, { recursive: true });

        // Convert each record to JSON and save as individual file
        for (const record of records) {
            // Clean up the record
            const cleanRecord = {
                name: record.name,
                counter: parseInt(record.counter),
                type: record.type,
                turn: record.turn.replace('?', ''),  // Remove question marks from turn
                bonus: record.bonus
            };

            // Add language only for non-papacy debaters
            if (record.type !== 'papacy') {
                cleanRecord.language = record.language;
            }

            // Add new fields
            cleanRecord.isActive = false;
            cleanRecord.isExcommunicated = false;

            // Create filename from debater name (replace spaces with underscores and lowercase)
            const filename = `${record.name.toLowerCase().replace(/\s+/g, '_')}.json`;
            const filePath = path.join(debatersDir, filename);

            // Write the JSON file
            await fs.writeFile(filePath, JSON.stringify(cleanRecord, null, 2));
            console.log(`Created ${filename}`);
        }

        console.log('Debater data conversion completed successfully!');
    } catch (error) {
        console.error('Error converting debater data:', error);
        throw error;
    }
}

module.exports = { convertDebaters }; 
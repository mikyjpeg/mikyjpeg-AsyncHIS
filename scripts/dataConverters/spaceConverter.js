const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parse/sync');

async function createSpaceFiles() {
    try {
        // Read the CSV file
        const csvContent = await fs.readFile(path.join(__dirname, '../resources/spaces.csv'), 'utf8');
        
        // Parse CSV content
        const records = csv.parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            relax_column_count: true,  // Allow varying column counts
            trim: true  // Trim whitespace from values
        });

        // Create data/spaces directory if it doesn't exist
        const spacesDir = path.join(__dirname, '../data/spaces');
        await fs.mkdir(spacesDir, { recursive: true });

        // Create a JSON file for each space
        for (const record of records) {
            const spaceData = {
                name: record.name,
                homePower: record['home_power'],
                language: record.language === '' ? null : record.language,
                type: record.type,
                hasPorts: record['has-ports'] === 'true',
                // Additional fields as requested
                controllingPower: null,
                connectedTo: [],
                passConnectedTo: [],
                troops: 0,
                leaders: []
            };

            // Add underSiege field for key, fortress, and capital spaces
            if (record.type === 'key' || record.type === 'fortress' || record.type === 'capital') {
                spaceData.underSiege = false;
            }

            // Create a safe filename
            const fileName = `${record.name.toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')  // Replace any non-alphanumeric chars with underscore
                .replace(/^_+|_+$/g, '')      // Remove leading/trailing underscores
            }.json`;
            
            const filePath = path.join(spacesDir, fileName);
            
            await fs.writeFile(filePath, JSON.stringify(spaceData, null, 2));
            console.log(`Created space file: ${fileName}`);
        }

        console.log('All space files have been created successfully!');
    } catch (error) {
        console.error('Error creating space files:', error);
        if (error.record) {
            console.error('Problem record:', error.record);
        }
    }
}

createSpaceFiles(); 
const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');

// Read the CSV file
const csvContent = fs.readFileSync('resources/cards.csv', 'utf-8');

// Parse CSV content
const records = csv.parse(csvContent, {
    columns: true,
    skip_empty_lines: true
});

// Create cards directory if it doesn't exist
const cardsDir = path.join('data', 'cards');
if (!fs.existsSync(cardsDir)) {
    fs.mkdirSync(cardsDir, { recursive: true });
}

// Define foreign war card IDs
const foreignWarCards = ['110', '92', '93'];

// Process each record
records.forEach(record => {
    // Convert string 'true'/'false' to boolean
    const processedRecord = {
        ...record,
        isMandatory: record.isMandatory === 'true',
        isResponse: record.isResponse === 'true',
        isCombat: record.isCombat === 'true',
        removeAfterUse: record.removeAfterUse === 'true',
        // Add isForeignWar field
        isForeignWar: foreignWarCards.includes(record.id),
        // Convert 'null' strings to actual null values
        actions: record.actions === 'null' ? null : record.actions,
        turn: record.turn === 'null' ? null : record.turn,
        year: record.year === 'null' ? null : parseInt(record.year)
    };

    // Create JSON file
    const fileName = `${record.id}.json`;
    const filePath = path.join(cardsDir, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(processedRecord, null, 2));
});

console.log('Card JSON files have been created successfully!'); 
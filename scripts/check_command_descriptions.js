const fs = require('fs');
const path = require('path');

const actionsDir = path.join(__dirname, '../src/commands/actions');

// Read all files in the actions directory
fs.readdir(actionsDir, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    files.forEach(file => {
        if (file.endsWith('.js')) {
            const filePath = path.join(actionsDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Extract description using regex
            const descMatch = content.match(/\.setDescription\(['"](.+?)['"]\)/);
            if (descMatch) {
                const description = descMatch[1];
                if (description.length > 100) {
                    console.log(`\nFile: ${file}`);
                    console.log(`Description length: ${description.length}`);
                    console.log(`Description: "${description}"`);
                }
            }
        }
    });
}); 
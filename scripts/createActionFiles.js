const fs = require('fs').promises;
const path = require('path');

async function createActionFiles() {
    try {
        // Read the source file
        const actionsFile = await fs.readFile(path.join(__dirname, '../resources/actions.json'), 'utf8');
        const actions = JSON.parse(actionsFile);

        // Create data/actions directory if it doesn't exist
        const actionsDir = path.join(__dirname, '../data/actions');
        await fs.mkdir(actionsDir, { recursive: true });

        // Process each action
        for (const action of actions) {
            // Create the new action object with improved structure
            const actionData = {
                name: action.action,
                factions: Object.entries(action.cost).reduce((acc, [faction, cost]) => {
                    // Only include factions that can perform the action
                    if (cost !== "-") {
                        acc[faction] = {
                            canPerform: true,
                            cost: parseInt(cost)
                        };
                    } else {
                        acc[faction] = {
                            canPerform: false
                        };
                    }
                    return acc;
                }, {}),
                rulesSection: action.section,
                description: action.description
            };

            // Create a safe filename from the action name
            const fileName = `${action.action.toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '')}.json`;
            
            const filePath = path.join(actionsDir, fileName);
            
            // Write the action file
            await fs.writeFile(filePath, JSON.stringify(actionData, null, 2));
            console.log(`Created action file: ${fileName}`);
        }

        console.log('All action files have been created successfully!');
    } catch (error) {
        console.error('Error creating action files:', error);
    }
}

createActionFiles(); 
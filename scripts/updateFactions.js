const { updateFactions } = require('../src/utils/factionUpdater');

console.log('Starting faction files update...');
updateFactions()
    .then(() => {
        console.log('Faction files update completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Failed to update faction files:', error);
        process.exit(1);
    }); 
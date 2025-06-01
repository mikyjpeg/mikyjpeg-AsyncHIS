const { updateFactions } = require('./dataUpdaters/factionUpdater');

console.log('Starting faction update...');
updateFactions()
    .then(() => {
        console.log('Faction update completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Failed to update factions:', error);
        process.exit(1);
    }); 
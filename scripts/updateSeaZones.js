const { updateSeaZones } = require('./dataUpdaters/seaZoneUpdater');

console.log('Starting sea zone update...');
updateSeaZones()
    .then(() => {
        console.log('Sea zone update completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Failed to update sea zones:', error);
        process.exit(1);
    }); 
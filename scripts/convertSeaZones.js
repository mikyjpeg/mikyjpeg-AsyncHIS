const { convertSeaZones } = require('./dataConverters/seaZoneConverter');

console.log('Starting sea zone conversion...');
convertSeaZones()
    .then(() => {
        console.log('Sea zone conversion completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Failed to convert sea zones:', error);
        process.exit(1);
    }); 
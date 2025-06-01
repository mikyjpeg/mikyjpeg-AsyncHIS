const { convertSpaces } = require('./dataConverters/spaceConverter');

console.log('Starting space conversion...');
convertSpaces()
    .then(() => {
        console.log('Space conversion completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Failed to convert spaces:', error);
        process.exit(1);
    }); 
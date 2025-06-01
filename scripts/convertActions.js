const { convertActions } = require('./dataConverters/actionConverter');

console.log('Starting action conversion...');
convertActions()
    .then(() => {
        console.log('Action conversion completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Failed to convert actions:', error);
        process.exit(1);
    }); 
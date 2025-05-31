const { updateSpaces } = require('../src/utils/spaceUpdater');

console.log('Starting space files update...');
updateSpaces()
    .then(() => {
        console.log('Space files update completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Failed to update space files:', error);
        process.exit(1);
    }); 
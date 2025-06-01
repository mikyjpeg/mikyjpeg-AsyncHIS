const { updateSpaceFormations } = require('./dataUpdaters/formationUpdater');

console.log('Starting space formations update...');
updateSpaceFormations()
    .then(() => {
        console.log('Space formations update completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Failed to update space formations:', error);
        process.exit(1);
    }); 
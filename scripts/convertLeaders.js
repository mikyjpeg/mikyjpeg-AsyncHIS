const { convertLeaders } = require('./dataConverters/leaderConverter');

console.log('Starting leader conversion...');
convertLeaders()
    .then(() => {
        console.log('Leader conversion completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Failed to convert leaders:', error);
        process.exit(1);
    }); 
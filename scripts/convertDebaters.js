const { convertDebaters } = require('./dataConverters/debaterConverter');

convertDebaters()
    .then(() => console.log('Debater conversion completed'))
    .catch(error => {
        console.error('Error during debater conversion:', error);
        process.exit(1);
    }); 
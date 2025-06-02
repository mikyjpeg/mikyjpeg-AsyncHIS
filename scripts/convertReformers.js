const { convertReformers } = require('./dataConverters/reformerConverter');

convertReformers()
    .then(() => console.log('Reformer conversion completed'))
    .catch(error => {
        console.error('Error during reformer conversion:', error);
        process.exit(1);
    }); 
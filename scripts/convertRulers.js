const { convertRulers } = require('../src/utils/rulerConverter');

console.log('Starting ruler conversion...');
convertRulers()
    .then(() => {
        console.log('Ruler conversion completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Failed to convert rulers:', error);
        process.exit(1);
    }); 
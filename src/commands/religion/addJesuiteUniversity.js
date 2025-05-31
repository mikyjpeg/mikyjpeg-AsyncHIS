const spaceManager = require('../../game/spaceManager');

module.exports = {
    name: 'add_jesuite',
    description: 'Add a Jesuite university to a space',
    usage: '!add_jesuite [space]',
    async execute(message, args) {
        if (args.length < 1) {
            throw new Error('Please specify the space. Usage: !add_jesuite [space]');
        }

        const spaceName = args[0];

        // Get the space data
        const space = await spaceManager.getSpace(spaceName);
        
        // Check if space is Catholic
        if (!space.catholic) {
            return `Cannot add a Jesuite university to ${spaceName} as it is not Catholic`;
        }

        // Check if university already exists
        if (space.jesuiteUniversity) {
            return `${spaceName} already has a Jesuite university`;
        }

        // Add the university
        space.jesuiteUniversity = true;
        await spaceManager.updateSpace(spaceName, space);

        return `Added a Jesuite university to ${spaceName}`;
    }
}; 
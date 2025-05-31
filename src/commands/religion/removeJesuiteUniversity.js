const spaceManager = require('../../game/spaceManager');

module.exports = {
    name: 'remove_jesuite',
    description: 'Remove a Jesuite university from a space',
    usage: '!remove_jesuite [space]',
    async execute(message, args) {
        if (args.length < 1) {
            throw new Error('Please specify the space. Usage: !remove_jesuite [space]');
        }

        const spaceName = args[0];

        // Get the space data
        const space = await spaceManager.getSpace(spaceName);
        
        // Check if university exists
        if (!space.jesuiteUniversity) {
            return `${spaceName} does not have a Jesuite university`;
        }

        // Remove the university
        space.jesuiteUniversity = false;
        await spaceManager.updateSpace(spaceName, space);

        return `Removed the Jesuite university from ${spaceName}`;
    }
}; 
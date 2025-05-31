const spaceManager = require('../../game/spaceManager');

module.exports = {
    name: 'list_reformers',
    description: 'List all reformers in a space',
    usage: '!list_reformers [space]',
    async execute(message, args) {
        if (args.length < 1) {
            throw new Error('Please specify the space. Usage: !list_reformers [space]');
        }

        const spaceName = args[0];

        // Get the space data
        const space = await spaceManager.getSpace(spaceName);
        
        if (space.reformers.length === 0) {
            return `${spaceName} has no reformers`;
        }

        const reformersList = space.reformers.map(r => `- ${r}`).join('\n');
        return `Reformers in ${spaceName}:\n${reformersList}`;
    }
}; 
const spaceManager = require('../../game/spaceManager');

module.exports = {
    name: 'remove_reformer',
    description: 'Remove a reformer from a space',
    usage: '!remove_reformer [space] [reformer_name]',
    async execute(message, args) {
        if (args.length < 2) {
            throw new Error('Please specify both the space and reformer name. Usage: !remove_reformer [space] [reformer_name]');
        }

        const spaceName = args[0];
        const reformerName = args.slice(1).join(' ');

        // Get the space data
        const space = await spaceManager.getSpace(spaceName);
        
        // Check if reformer exists
        if (!space.reformers.includes(reformerName)) {
            return `${reformerName} is not a reformer in ${spaceName}`;
        }

        // Remove the reformer
        space.reformers = space.reformers.filter(r => r !== reformerName);
        await spaceManager.updateSpace(spaceName, space);

        return `Removed ${reformerName} as a reformer from ${spaceName}`;
    }
}; 
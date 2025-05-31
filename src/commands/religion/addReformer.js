const spaceManager = require('../../game/spaceManager');

module.exports = {
    name: 'add_reformer',
    description: 'Add a reformer to a space',
    usage: '!add_reformer [space] [reformer_name]',
    async execute(message, args) {
        if (args.length < 2) {
            throw new Error('Please specify both the space and reformer name. Usage: !add_reformer [space] [reformer_name]');
        }

        const spaceName = args[0];
        const reformerName = args.slice(1).join(' ');

        // Get the space data
        const space = await spaceManager.getSpace(spaceName);
        
        // Check if reformer already exists
        if (space.reformers.includes(reformerName)) {
            return `${reformerName} is already a reformer in ${spaceName}`;
        }

        // Add the reformer
        space.reformers.push(reformerName);
        await spaceManager.updateSpace(spaceName, space);

        return `Added ${reformerName} as a reformer in ${spaceName}`;
    }
}; 
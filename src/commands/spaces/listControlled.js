const spaceManager = require('../../game/spaceManager');

module.exports = {
    name: 'controlled',
    description: 'List all spaces controlled by a power',
    usage: '!controlled [power]',
    async execute(message, args) {
        if (args.length < 1) {
            throw new Error('Please specify the power to check. Usage: !controlled [power]');
        }

        const powerName = args.join(' ');
        const controlledSpaces = await spaceManager.getControlledSpaces(powerName);
        
        if (controlledSpaces.length === 0) {
            return `${powerName} does not control any spaces.`;
        }

        const spacesList = controlledSpaces
            .map(space => `- ${space.name}${space.type === 'key' || space.type === 'fortress' || space.type === 'capital' ? ` (${space.type})` : ''}`)
            .join('\n');
        
        return `Spaces controlled by ${powerName}:\n${spacesList}`;
    }
}; 
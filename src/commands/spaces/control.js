const spaceManager = require('../../game/spaceManager');
const factionManager = require('../../game/factionManager');

module.exports = {
    name: 'control',
    description: 'Take control of a space with a power',
    usage: '!control [space] [power]',
    async execute(message, args) {
        if (args.length < 2) {
            throw new Error('Please specify both the space name and the power that will control it. Usage: !control [space] [power]');
        }

        const spaceName = args[0];
        const powerName = args.slice(1).join(' ');
        
        // Validate that the user can control this power
        await spaceManager.validateUserControl(message.author.id, powerName, factionManager);
        
        console.log(`Attempting to set ${powerName} control over ${spaceName}`);
        await spaceManager.takeControl(spaceName, powerName, message.author.id);
        return `Successfully set ${powerName} control over ${spaceName}`;
    }
}; 
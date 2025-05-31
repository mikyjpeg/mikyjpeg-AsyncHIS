const spaceManager = require('../../game/spaceManager');

module.exports = {
    name: 'convert',
    description: 'Convert a space to Catholicism or Protestantism',
    usage: '!convert [space] [catholic|protestant]',
    async execute(message, args) {
        if (args.length < 2) {
            throw new Error('Please specify both the space and religion (catholic/protestant). Usage: !convert [space] [catholic|protestant]');
        }

        const spaceName = args[0];
        const religion = args[1].toLowerCase();

        if (religion !== 'catholic' && religion !== 'protestant') {
            throw new Error('Religion must be either "catholic" or "protestant"');
        }

        // Get the space data
        const space = await spaceManager.getSpace(spaceName);
        
        // Check if space can be converted (not Ottoman or Mixed)
        if (space.homePower === 'Ottoman' || space.homePower === 'Mixed') {
            return `${spaceName} cannot be converted as it is ${space.homePower} territory`;
        }

        const converting = religion === 'catholic';
        
        // Check if already that religion
        if (space.catholic === converting) {
            return `${spaceName} is already ${converting ? 'Catholic' : 'Protestant'}`;
        }

        // Convert the space
        space.catholic = converting;
        
        // If converting to Protestant, remove any Jesuite university
        if (!converting && space.jesuiteUniversity) {
            space.jesuiteUniversity = false;
        }

        await spaceManager.updateSpace(spaceName, space);

        let responseText = `Converted ${spaceName} to ${converting ? 'Catholicism' : 'Protestantism'}`;
        if (!converting && space.jesuiteUniversity) {
            responseText += ' and removed its Jesuite university';
        }

        return responseText;
    }
}; 
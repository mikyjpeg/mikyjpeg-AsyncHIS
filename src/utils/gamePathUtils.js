const path = require('path');
const fs = require('fs');

function getGamePath(channelId) {
    if (!channelId) {
        throw new Error('Channel ID is required');
    }

    let gameId;
    // If the channelId is a channel name (e.g. c50a542b_his), extract the game ID
    if (typeof channelId === 'string' && channelId.includes('_')) {
        gameId = channelId.split('_')[0];
    } else {
        // Otherwise treat it as a numeric Discord channel ID and take first 8 characters
        gameId = channelId.substring(0, 8);
    }

    const gamePath = path.join('data', 'games', gameId);

    // Check if the game directory exists
    const fullPath = path.join(process.cwd(), gamePath);
    if (!fs.existsSync(fullPath)) {
        throw new Error(`Game not found for channel ${channelId}. Please start a new game using /start command.`);
    }

    return gamePath;
}

module.exports = {
    getGamePath
}; 
const path = require('path');
const fs = require('fs');

function getGamePath(channelId) {
    if (!channelId) {
        throw new Error('Channel ID is required');
    }

    // Take first 8 characters of channel ID
    const gameId = channelId.substring(0, 8);
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
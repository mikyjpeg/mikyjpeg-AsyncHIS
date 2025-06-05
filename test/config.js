/**
 * Test configuration that handles game ID setup.
 * The game ID can be set in two ways:
 * 1. Through environment variable: TEST_GAME_ID
 * 2. Through Jest CLI argument: --gameId=your_game_id
 * 
 * Example usage:
 * - Using env variable: TEST_GAME_ID=abc12345 npm test
 * - Using CLI argument: npm test -- --gameId=abc12345
 */

function getGameId() {
    // First try to get from Jest CLI arguments
    const gameIdArg = process.argv.find(arg => arg.startsWith('--gameId='));
    if (gameIdArg) {
        return gameIdArg.split('=')[1];
    }

    // Then try environment variable
    if (process.env.TEST_GAME_ID) {
        return process.env.TEST_GAME_ID;
    }

    // Default game ID for tests
    return 'default0';
}

const gameId = getGameId();
const channelName = `${gameId}_test`;

module.exports = {
    gameId,
    channelName
}; 
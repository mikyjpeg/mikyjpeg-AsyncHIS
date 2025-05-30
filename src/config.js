require('dotenv').config();

module.exports = {
    // Your bot's token (will be loaded from .env file)
    token: process.env.DISCORD_TOKEN,
    
    // Your bot's prefix for commands (e.g., !help, !ping)
    prefix: '!',
    
    // Your bot's client ID (for slash commands)
    clientId: process.env.CLIENT_ID,
    
    // Your server's ID (for guild-specific commands)
    guildId: process.env.GUILD_ID
}; 
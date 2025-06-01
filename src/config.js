require('dotenv').config();

const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
    // Your bot's token (will be loaded from .env file)
    token: process.env.DISCORD_TOKEN,
    
    // Your bot's client ID (for slash commands)
    clientId: process.env.CLIENT_ID,
    
    // Environment configuration
    isDevelopment,
    
    // Guild ID configuration
    // In development: use DEV_GUILD_ID for faster command updates
    // In production: commands will be registered globally
    guildId: isDevelopment ? process.env.DEV_GUILD_ID : null,
    
    // Command registration configuration
    commandConfig: {
        // In development: register commands to specific guild for instant updates
        // In production: register commands globally
        global: !isDevelopment,
        
        // Development guild ID for testing
        guildId: process.env.DEV_GUILD_ID
    }
}; 
const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { token } = require('./config.js');
const { GameState, POWERS } = require('./game/gameState');
const commandHandler = require('./commands/commandHandler');

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Serve static files from the resources directory
const resourcesPath = path.join(__dirname, '../resources');
console.log('Serving static files from:', resourcesPath);
app.use('/resources', express.static(resourcesPath));

// API Routes
app.get('/api/game/status', async (req, res) => {
    try {
        const status = await GameState.getGameStatus();
        res.json(status);
    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({ error: 'Failed to get game status' });
    }
});

// Test endpoint for resources
app.get('/test-resources', (req, res) => {
    res.send(`
        <h1>Resource Test</h1>
        <img src="/resources/HereIStandMap6.jpg" alt="Test Map" style="max-width: 100%;" />
    `);
});

// Start Express server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`API Server running on port ${PORT}`);
});

// Create Discord client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// When the client is ready, run this code (only once)
client.once('ready', async () => {
    console.log('Here I Stand Bot is ready! 🏰');
    // Initialize the game state and load commands
    await GameState.initialize();
    await commandHandler.loadCommands();
});

// Handle slash commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    await commandHandler.executeInteraction(interaction);
});

// Error handling for Discord client
client.on('error', error => {
    console.error('Discord client error:', error);
});

client.on('warn', warning => {
    console.warn('Discord client warning:', warning);
});

// Login to Discord with your client's token
client.login(token).then(() => {
    console.log('Discord bot logged in successfully');
}).catch(error => {
    console.error('Failed to log in to Discord:', error);
}); 
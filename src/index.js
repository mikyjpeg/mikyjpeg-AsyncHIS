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

// Helper function to safely send a reply
async function safeReply(message, content) {
    try {
        console.log('SafeReply - Attempting to send:', content);
        return await message.channel.send(`${message.author}: ${content}`);
    } catch (error) {
        console.error('SafeReply - Error:', error.message);
        // Don't throw, just return false to indicate failure
        return false;
    }
}

// Handle messages
client.on('messageCreate', async message => {
    // Ignore messages from bots
    if (message.author.bot) return;

    // Check if message starts with command prefix
    if (!message.content.startsWith('!')) return;

    const args = message.content.slice(1).split(' ');
    const commandName = args.shift().toLowerCase();

    console.log(`Processing command: ${commandName} from user: ${message.author.username}`);

    try {
        if (commandName === 'help') {
            const helpMessage = `Available commands:\n${commandHandler.getCommandList()}`;
            await safeReply(message, helpMessage);
            return;
        }

        const response = await commandHandler.executeCommand(commandName, message, args);
        if (response) {
            await safeReply(message, response);
        }
    } catch (error) {
        console.error('Command error:', error.message);
        try {
            await message.channel.send(`Error: ${error.message}`);
        } catch (msgError) {
            console.error('Failed to send error message:', msgError.message);
        }
    }
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
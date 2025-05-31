const { Client, GatewayIntentBits, Collection } = require('discord.js');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { token } = require('./config.js');
const { GameState, POWERS } = require('./game/gameState');
const factionManager = require('./game/factionManager');
const spaceManager = require('./game/spaceManager');
const diplomacyManager = require('./game/diplomacyManager');

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

// Command collection
client.commands = new Collection();

// When the client is ready, run this code (only once)
client.once('ready', async () => {
    console.log('Here I Stand Bot is ready! 🏰');
    // Initialize the game state
    await GameState.initialize();
});

// Helper function to format available powers
function formatPowers(powers) {
    return powers.map(power => `- ${power}`).join('\n');
}

// Helper function for printing
function print(message) {
    process.stdout.write(message + '\n');
}

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

// Helper function to format game status
async function formatGameStatus() {
    console.log('Formatting game status...');
    const status = await GameState.getGameStatus();
    const activePlayers = Object.values(status.factions)
        .filter(f => f.isActive)
        .map(f => `${f.discordUsername} as ${f.name}`)
        .join('\n');
    
    const statusMessage = `Game Status:
Turn: ${status.turn}
Phase: ${status.phase}
Current Player: ${status.activePlayer || 'None'}

Current Powers:
${activePlayers || 'No powers claimed'}

Available Powers:
${formatPowers(status.availablePowers)}`;

    console.log('Formatted status:', statusMessage);
    return statusMessage;
}

// Handle messages
client.on('messageCreate', async message => {
    // Ignore messages from bots
    if (message.author.bot) return;

    const args = message.content.split(' ');
    const command = args[0].toLowerCase();

    console.log(`Processing command: ${command} from user: ${message.author.username}`);

    try {
        switch (command) {
            case '!game':
                await safeReply(message, 'Here I Stand game assistant at your service! 🏰\nUse !help for available commands.');
                break;

            case '!help':
                await safeReply(message, `Available commands:
- !game - Check if the bot is active
- !help - Show this help message
- !start - Start a new game
- !join [power] - Join the game as a power (Ottoman, Hapsburg, England, France, Papacy, or Protestant)
- !leave [power] - Give up control of a power
- !status - Show current game status
- !control [space] [power] - Take control of a space with a power
- !uncontrol [space] - Remove control of a space
- !controlled [power] - List all spaces controlled by a power
- !declare_war [power1] [power2] - Declare war between two powers
- !make_peace [power1] [power2] - Make peace between two powers
- !ally [power1] [power2] - Form an alliance between two powers
- !break_alliance [power1] [power2] - Break an alliance between two powers`);
                break;

            case '!start':
                console.log('Starting new game...');
                await GameState.startGame();
                await safeReply(message, `Game started! Available powers:\n${formatPowers(Object.values(POWERS))}\nUse !join [power] to join the game.`);
                break;

            case '!join':
                if (args.length < 2) {
                    await safeReply(message, `Please specify a power. Available powers:\n${formatPowers(GameState.availablePowers)}`);
                    break;
                }
                try {
                    const powerInput = args.slice(1).join(' ').replace(/[\[\]]/g, '');
                    const powerName = powerInput.charAt(0).toUpperCase() + powerInput.slice(1).toLowerCase();
                    console.log(`User ${message.author.username} attempting to join as ${powerName}`);
                    
                    await GameState.assignPower(message.author.id, message.author.username, powerName);
                    console.log(`Successfully assigned ${powerName} to ${message.author.username}`);
                    
                    console.log('>>> BEFORE SAFE REPLY - JOIN <<<');
                    const joinReplySuccess = await safeReply(message, `Successfully assigned ${powerName} to ${message.author.username}`);
                    console.log('>>> AFTER SAFE REPLY - JOIN:', joinReplySuccess ? 'SUCCESS' : 'FAILED', '<<<');
                    
                } catch (error) {
                    console.error('Error in join command:', error.message);
                    try {
                        await message.channel.send(`Error: ${error.message}`);
                    } catch (msgError) {
                        console.error('Failed to send error message:', msgError.message);
                    }
                }
                break;

            case '!leave':
                if (args.length < 2) {
                    await safeReply(message, 'Please specify the power you want to give up');
                    break;
                }
                try {
                    const leaveInput = args.slice(1).join(' ').replace(/[\[\]]/g, '');
                    const leavePowerName = leaveInput.charAt(0).toUpperCase() + leaveInput.slice(1).toLowerCase();
                    console.log(`User ${message.author.username} attempting to leave ${leavePowerName}`);
                    
                    await GameState.leavePower(message.author.id, leavePowerName);
                    console.log(`Successfully removed ${message.author.username} from ${leavePowerName}`);
                    
                    console.log('>>> BEFORE SAFE REPLY - LEAVE <<<');
                    const leaveReplySuccess = await safeReply(message, `Successfully removed ${message.author.username} from ${leavePowerName}`);
                    console.log('>>> AFTER SAFE REPLY - LEAVE:', leaveReplySuccess ? 'SUCCESS' : 'FAILED', '<<<');
                    
                } catch (error) {
                    console.error('Error in leave command:', error.message);
                    try {
                        await message.channel.send(`Error: ${error.message}`);
                    } catch (msgError) {
                        console.error('Failed to send error message:', msgError.message);
                    }
                }
                break;

            case '!status':
                console.log('Processing status command...');
                const statusMessage = await formatGameStatus();
                await safeReply(message, statusMessage);
                break;

            case '!control':
                if (args.length < 3) {
                    await safeReply(message, 'Please specify both the space name and the power that will control it. Usage: !control [space] [power]');
                    break;
                }
                try {
                    const spaceName = args[1];
                    const powerName = args.slice(2).join(' ');
                    
                    // Validate that the user can control this power
                    await spaceManager.validateUserControl(message.author.id, powerName, factionManager);
                    
                    console.log(`Attempting to set ${powerName} control over ${spaceName}`);
                    await spaceManager.takeControl(spaceName, powerName, message.author.id);
                    await safeReply(message, `Successfully set ${powerName} control over ${spaceName}`);
                } catch (error) {
                    console.error('Error in control command:', error.message);
                    await message.channel.send(`Error: ${error.message}`);
                }
                break;

            case '!uncontrol':
                if (args.length < 2) {
                    await safeReply(message, 'Please specify the space name. Usage: !uncontrol [space]');
                    break;
                }
                try {
                    const spaceName = args[1];
                    
                    // Get the space to check who controls it
                    const space = await spaceManager.getSpace(spaceName);
                    if (space.controllingPower) {
                        // Validate that the user controls the power that controls the space
                        await spaceManager.validateUserControl(message.author.id, space.controllingPower, factionManager);
                    }
                    
                    console.log(`Attempting to remove control from ${spaceName}`);
                    await spaceManager.removeControl(spaceName);
                    await safeReply(message, `Successfully removed control from ${spaceName}`);
                } catch (error) {
                    console.error('Error in uncontrol command:', error.message);
                    await message.channel.send(`Error: ${error.message}`);
                }
                break;

            case '!controlled':
                if (args.length < 2) {
                    await safeReply(message, 'Please specify the power to check. Usage: !controlled [power]');
                    break;
                }
                try {
                    const powerName = args.slice(1).join(' ');
                    const controlledSpaces = await spaceManager.getControlledSpaces(powerName);
                    
                    if (controlledSpaces.length === 0) {
                        await safeReply(message, `${powerName} does not control any spaces.`);
                    } else {
                        const spacesList = controlledSpaces
                            .map(space => `- ${space.name}${space.type === 'key' || space.type === 'fortress' || space.type === 'capital' ? ` (${space.type})` : ''}`)
                            .join('\n');
                        await safeReply(message, `Spaces controlled by ${powerName}:\n${spacesList}`);
                    }
                } catch (error) {
                    console.error('Error in controlled command:', error.message);
                    await message.channel.send(`Error: ${error.message}`);
                }
                break;

            case '!declare_war':
                if (args.length < 3) {
                    await safeReply(message, 'Please specify both powers. Usage: !declare_war [power1] [power2]');
                    break;
                }
                try {
                    const power1 = args[1];
                    const power2 = args[2];
                    console.log(`Attempting to declare war between ${power1} and ${power2}`);
                    
                    await diplomacyManager.declareWar(power1, power2);
                    await safeReply(message, `War declared between ${power1} and ${power2}!`);
                } catch (error) {
                    console.error('Error in declare_war command:', error.message);
                    await message.channel.send(`Error: ${error.message}`);
                }
                break;

            case '!make_peace':
                if (args.length < 3) {
                    await safeReply(message, 'Please specify both powers. Usage: !make_peace [power1] [power2]');
                    break;
                }
                try {
                    const power1 = args[1];
                    const power2 = args[2];
                    console.log(`Attempting to make peace between ${power1} and ${power2}`);
                    
                    await diplomacyManager.makePeace(power1, power2);
                    await safeReply(message, `Peace established between ${power1} and ${power2}!`);
                } catch (error) {
                    console.error('Error in make_peace command:', error.message);
                    await message.channel.send(`Error: ${error.message}`);
                }
                break;

            case '!ally':
                if (args.length < 3) {
                    await safeReply(message, 'Please specify both powers. Usage: !ally [power1] [power2]');
                    break;
                }
                try {
                    const power1 = args[1];
                    const power2 = args[2];
                    console.log(`Attempting to form alliance between ${power1} and ${power2}`);
                    
                    await diplomacyManager.declareAlliance(power1, power2);
                    await safeReply(message, `Alliance formed between ${power1} and ${power2}!`);
                } catch (error) {
                    console.error('Error in ally command:', error.message);
                    await message.channel.send(`Error: ${error.message}`);
                }
                break;

            case '!break_alliance':
                if (args.length < 3) {
                    await safeReply(message, 'Please specify both powers. Usage: !break_alliance [power1] [power2]');
                    break;
                }
                try {
                    const power1 = args[1];
                    const power2 = args[2];
                    console.log(`Attempting to break alliance between ${power1} and ${power2}`);
                    
                    await diplomacyManager.removeAlliance(power1, power2);
                    await safeReply(message, `Alliance broken between ${power1} and ${power2}!`);
                } catch (error) {
                    console.error('Error in break_alliance command:', error.message);
                    await message.channel.send(`Error: ${error.message}`);
                }
                break;
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
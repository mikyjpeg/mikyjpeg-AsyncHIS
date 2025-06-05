const fs = require('fs').promises;
const path = require('path');
const spaceManager = require('../src/game/spaceManager');
const reformerManager = require('../src/game/reformerManager');
const debaterManager = require('../src/game/debaterManager');
const { commandHistory } = require('../src/game/commandHistoryManager');
const { gameId, channelName } = require('./config');

describe('Religion Commands', () => {
    // Helper function to read a JSON file
    async function readJsonFile(filePath) {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    }

    // Setup: Create necessary directories and files before tests
    beforeAll(async () => {
        const gameDir = path.join(process.cwd(), 'data', 'games', gameId);
        const dirs = ['spaces', 'reformers', 'debaters'];
        
        // Create directories
        for (const dir of dirs) {
            await fs.mkdir(path.join(gameDir, dir), { recursive: true });
        }

        // Create initial space data
        const spaceData = {
            name: 'Wittenberg',
            type: 'key',
            catholic: true,
            hasJesuiteUniversity: false,
            protestantInfluence: 0,
            catholicInfluence: 0,
            formations: []
        };
        await fs.writeFile(
            path.join(gameDir, 'spaces', 'wittenberg.json'),
            JSON.stringify(spaceData, null, 2)
        );

        // Create initial reformer data
        const reformerData = {
            name: 'Luther',
            isActive: true,
            isExcommunicated: false,
            space: 'Wittenberg'
        };
        await fs.writeFile(
            path.join(gameDir, 'reformers', 'luther.json'),
            JSON.stringify(reformerData, null, 2)
        );

        // Create initial debater data
        const debaterData = {
            name: 'Eck',
            type: 'Catholic',
            isCurrentDebater: false,
            isActive: true
        };
        await fs.writeFile(
            path.join(gameDir, 'debaters', 'eck.json'),
            JSON.stringify(debaterData, null, 2)
        );
    });

    // Cleanup: Remove test data after all tests
    afterAll(async () => {
        const gameDir = path.join(process.cwd(), 'data', 'games', gameId);
        await fs.rm(gameDir, { recursive: true, force: true });
    });

    describe('Toggle Religious Control', () => {
        it('should toggle a space between Catholic and Protestant control', async () => {
            const spaceName = 'Wittenberg';
            const space = await spaceManager(channelName).getSpace(spaceName);
            
            // Store initial state
            const initialState = { ...space };
            expect(space.catholic).toBe(true);

            // Toggle to Protestant
            space.catholic = false;
            await spaceManager(channelName).updateSpace(spaceName, space);
            
            // Record command in history
            await commandHistory(channelName).recordSlashCommand(
                { channelId: channelName },
                'TOGGLE_RELIGIOUS_CONTROL',
                {
                    spaceName,
                    oldState: initialState,
                    newState: space
                }
            );

            // Verify change
            const updatedSpace = await spaceManager(channelName).getSpace(spaceName);
            expect(updatedSpace.catholic).toBe(false);

            // Undo the change
            const lastCommand = await commandHistory(channelName).getLastCommand();
            await spaceManager(channelName).updateSpace(spaceName, lastCommand.data.oldState);

            // Verify undo
            const finalSpace = await spaceManager(channelName).getSpace(spaceName);
            expect(finalSpace.catholic).toBe(true);
        });
    });

    describe('Add/Remove Jesuite University', () => {
        it('should add and remove a Jesuite university from a space', async () => {
            const spaceName = 'Wittenberg';
            const space = await spaceManager(channelName).getSpace(spaceName);
            
            // Store initial state
            const initialState = { ...space };
            expect(space.hasJesuiteUniversity).toBe(false);

            // Add Jesuite university
            space.hasJesuiteUniversity = true;
            await spaceManager(channelName).updateSpace(spaceName, space);
            
            // Record command in history
            await commandHistory(channelName).recordSlashCommand(
                { channelId: channelName },
                'ADD_JESUITE',
                {
                    spaceName,
                    oldState: initialState,
                    newState: space
                }
            );

            // Verify change
            const updatedSpace = await spaceManager(channelName).getSpace(spaceName);
            expect(updatedSpace.hasJesuiteUniversity).toBe(true);

            // Undo the change
            const lastCommand = await commandHistory(channelName).getLastCommand();
            await spaceManager(channelName).updateSpace(spaceName, lastCommand.data.oldState);

            // Verify undo
            const finalSpace = await spaceManager(channelName).getSpace(spaceName);
            expect(finalSpace.hasJesuiteUniversity).toBe(false);
        });
    });

    describe('Set Religious Influence', () => {
        it('should set Protestant and Catholic influence in a space', async () => {
            const spaceName = 'Wittenberg';
            const space = await spaceManager(channelName).getSpace(spaceName);
            
            // Store initial state
            const initialState = { ...space };
            expect(space.protestantInfluence).toBe(0);
            expect(space.catholicInfluence).toBe(0);

            // Set influence
            space.protestantInfluence = 2;
            space.catholicInfluence = 1;
            await spaceManager(channelName).updateSpace(spaceName, space);
            
            // Record command in history
            await commandHistory(channelName).recordSlashCommand(
                { channelId: channelName },
                'SET_RELIGIOUS_INFLUENCE',
                {
                    spaceName,
                    oldState: initialState,
                    newState: space
                }
            );

            // Verify change
            const updatedSpace = await spaceManager(channelName).getSpace(spaceName);
            expect(updatedSpace.protestantInfluence).toBe(2);
            expect(updatedSpace.catholicInfluence).toBe(1);

            // Undo the change
            const lastCommand = await commandHistory(channelName).getLastCommand();
            await spaceManager(channelName).updateSpace(spaceName, lastCommand.data.oldState);

            // Verify undo
            const finalSpace = await spaceManager(channelName).getSpace(spaceName);
            expect(finalSpace.protestantInfluence).toBe(0);
            expect(finalSpace.catholicInfluence).toBe(0);
        });
    });

    describe('Debater Management', () => {
        it('should set and clear current debater', async () => {
            const debaterName = 'Eck';
            const debater = await debaterManager(channelName).getDebater(debaterName);
            
            // Store initial state
            const initialState = { ...debater };
            expect(debater.isCurrentDebater).toBe(false);

            // Set as current debater
            debater.isCurrentDebater = true;
            await debaterManager(channelName).updateDebater(debaterName, debater);
            
            // Record command in history
            await commandHistory(channelName).recordSlashCommand(
                { channelId: channelName },
                'SET_CURRENT_DEBATER',
                {
                    oldStates: [{ debaterName, oldState: initialState }],
                    newDebater: debaterName
                }
            );

            // Verify change
            const updatedDebater = await debaterManager(channelName).getDebater(debaterName);
            expect(updatedDebater.isCurrentDebater).toBe(true);

            // Undo the change
            const lastCommand = await commandHistory(channelName).getLastCommand();
            for (const { debaterName, oldState } of lastCommand.data.oldStates) {
                await debaterManager(channelName).updateDebater(debaterName, oldState);
            }

            // Verify undo
            const finalDebater = await debaterManager(channelName).getDebater(debaterName);
            expect(finalDebater.isCurrentDebater).toBe(false);
        });
    });
}); 
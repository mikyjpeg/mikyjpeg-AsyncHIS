const fs = require('fs').promises;
const path = require('path');
const factionManager = require('../src/game/factionManager');
const { commandHistory } = require('../src/game/commandHistoryManager');

describe('Victory Points Commands', () => {
    const gameId = 'test1234';
    const channelName = `${gameId}_test`;
    
    // Setup: Create necessary directories and files before tests
    beforeAll(async () => {
        const gameDir = path.join(process.cwd(), 'data', 'games', gameId);
        const dirs = ['factions'];
        
        // Create directories
        for (const dir of dirs) {
            await fs.mkdir(path.join(gameDir, dir), { recursive: true });
        }

        // Create initial faction data
        const factions = [
            {
                name: 'France',
                type: 'major',
                cardModifier: 0,
                victoryPoints: 0,
                atWar: []
            },
            {
                name: 'Ottoman',
                type: 'major',
                cardModifier: 0,
                victoryPoints: 0,
                atWar: []
            }
        ];

        for (const faction of factions) {
            await fs.writeFile(
                path.join(gameDir, 'factions', `${faction.name.toLowerCase()}.json`),
                JSON.stringify(faction, null, 2)
            );
        }
    });

    // Cleanup: Remove test data after all tests
    afterAll(async () => {
        const gameDir = path.join(process.cwd(), 'data', 'games', gameId);
        await fs.rm(gameDir, { recursive: true, force: true });
    });

    describe('Add Victory Points', () => {
        it('should add victory points to a faction', async () => {
            const factionName = 'France';
            const faction = await factionManager(channelName).getFaction(factionName);
            
            // Store initial state
            const initialState = { ...faction };
            expect(faction.victoryPoints).toBe(0);

            // Add victory points
            const pointsToAdd = 3;
            faction.victoryPoints += pointsToAdd;
            await factionManager(channelName).updateFaction(factionName, faction);
            
            // Record command in history
            await commandHistory(channelName).recordSlashCommand(
                { channelId: channelName },
                'ADD_VP',
                {
                    power: factionName,
                    amount: pointsToAdd,
                    oldState: initialState
                }
            );

            // Verify change
            const updatedFaction = await factionManager(channelName).getFaction(factionName);
            expect(updatedFaction.victoryPoints).toBe(3);

            // Undo the change
            const lastCommand = await commandHistory(channelName).getLastCommand();
            await factionManager(channelName).updateFaction(factionName, lastCommand.data.oldState);

            // Verify undo
            const finalFaction = await factionManager(channelName).getFaction(factionName);
            expect(finalFaction.victoryPoints).toBe(0);
        });
    });

    describe('Remove Victory Points', () => {
        it('should remove victory points from a faction', async () => {
            const factionName = 'France';
            const faction = await factionManager(channelName).getFaction(factionName);
            
            // First add some points
            faction.victoryPoints = 5;
            await factionManager(channelName).updateFaction(factionName, faction);

            // Store state before removal
            const stateBeforeRemoval = { ...await factionManager(channelName).getFaction(factionName) };
            expect(stateBeforeRemoval.victoryPoints).toBe(5);

            // Remove victory points
            const pointsToRemove = 2;
            faction.victoryPoints -= pointsToRemove;
            await factionManager(channelName).updateFaction(factionName, faction);
            
            // Record command in history
            await commandHistory(channelName).recordSlashCommand(
                { channelId: channelName },
                'REMOVE_VP',
                {
                    power: factionName,
                    amount: pointsToRemove,
                    oldState: stateBeforeRemoval
                }
            );

            // Verify change
            const updatedFaction = await factionManager(channelName).getFaction(factionName);
            expect(updatedFaction.victoryPoints).toBe(3);

            // Undo the change
            const lastCommand = await commandHistory(channelName).getLastCommand();
            await factionManager(channelName).updateFaction(factionName, lastCommand.data.oldState);

            // Verify undo
            const finalFaction = await factionManager(channelName).getFaction(factionName);
            expect(finalFaction.victoryPoints).toBe(5);
        });
    });

    describe('Set Victory Points', () => {
        it('should set victory points for a faction', async () => {
            const factionName = 'France';
            const faction = await factionManager(channelName).getFaction(factionName);
            
            // First set some initial points
            faction.victoryPoints = 2;
            await factionManager(channelName).updateFaction(factionName, faction);

            // Store state before set
            const stateBeforeSet = { ...await factionManager(channelName).getFaction(factionName) };
            expect(stateBeforeSet.victoryPoints).toBe(2);

            // Set victory points
            const newPoints = 7;
            faction.victoryPoints = newPoints;
            await factionManager(channelName).updateFaction(factionName, faction);
            
            // Record command in history
            await commandHistory(channelName).recordSlashCommand(
                { channelId: channelName },
                'SET_VP',
                {
                    power: factionName,
                    oldState: stateBeforeSet,
                    newState: faction
                }
            );

            // Verify change
            const updatedFaction = await factionManager(channelName).getFaction(factionName);
            expect(updatedFaction.victoryPoints).toBe(7);

            // Undo the change
            const lastCommand = await commandHistory(channelName).getLastCommand();
            await factionManager(channelName).updateFaction(factionName, lastCommand.data.oldState);

            // Verify undo
            const finalFaction = await factionManager(channelName).getFaction(factionName);
            expect(finalFaction.victoryPoints).toBe(2);
        });
    });
}); 
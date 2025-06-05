const fs = require('fs').promises;
const path = require('path');
const spaceManager = require('../src/game/spaceManager');
const formationManager = require('../src/game/formationManager');
const { commandHistory } = require('../src/game/commandHistoryManager');

describe('Formation Commands', () => {
    const gameId = 'test1234';
    const channelName = `${gameId}_test`;
    
    // Setup: Create necessary directories and files before tests
    beforeAll(async () => {
        const gameDir = path.join(process.cwd(), 'data', 'games', gameId);
        const dirs = ['spaces'];
        
        // Create directories
        for (const dir of dirs) {
            await fs.mkdir(path.join(gameDir, dir), { recursive: true });
        }

        // Create initial space data
        const spaces = [
            {
                name: 'Istanbul',
                type: 'key',
                catholic: false,
                formations: [],
                controllingPower: 'Ottoman'
            },
            {
                name: 'Paris',
                type: 'key',
                catholic: true,
                formations: [],
                controllingPower: 'France'
            }
        ];

        for (const space of spaces) {
            await fs.writeFile(
                path.join(gameDir, 'spaces', `${space.name.toLowerCase()}.json`),
                JSON.stringify(space, null, 2)
            );
        }
    });

    // Cleanup: Remove test data after all tests
    afterAll(async () => {
        const gameDir = path.join(process.cwd(), 'data', 'games', gameId);
        await fs.rm(gameDir, { recursive: true, force: true });
    });

    describe('Add Formation', () => {
        it('should add an Ottoman formation with cavalry', async () => {
            const spaceName = 'Istanbul';
            const space = await spaceManager(channelName).getSpace(spaceName);
            
            // Store initial state
            const initialState = { ...space };
            expect(space.formations.length).toBe(0);

            // Add formation
            const formation = {
                power: 'Ottoman',
                regularTroops: 5,
                secondaryTroops: 3, // cavalry for Ottoman
                leaders: ['Suleiman', 'Ibrahim']
            };

            space.formations.push(formation);
            await spaceManager(channelName).updateSpace(spaceName, space);
            
            // Record command in history
            await commandHistory(channelName).recordSlashCommand(
                { channelId: channelName },
                'ADD_FORMATION',
                {
                    spaceName,
                    formation,
                    oldState: initialState
                }
            );

            // Verify change
            const updatedSpace = await spaceManager(channelName).getSpace(spaceName);
            expect(updatedSpace.formations.length).toBe(1);
            expect(updatedSpace.formations[0]).toEqual(formation);

            // Undo the change
            const lastCommand = await commandHistory(channelName).getLastCommand();
            await spaceManager(channelName).updateSpace(spaceName, lastCommand.data.oldState);

            // Verify undo
            const finalSpace = await spaceManager(channelName).getSpace(spaceName);
            expect(finalSpace.formations.length).toBe(0);
        });

        it('should add a French formation with mercenaries', async () => {
            const spaceName = 'Paris';
            const space = await spaceManager(channelName).getSpace(spaceName);
            
            // Store initial state
            const initialState = { ...space };
            expect(space.formations.length).toBe(0);

            // Add formation
            const formation = {
                power: 'France',
                regularTroops: 4,
                secondaryTroops: 2, // mercenaries for other powers
                leaders: ['Francis I', 'Montmorency']
            };

            space.formations.push(formation);
            await spaceManager(channelName).updateSpace(spaceName, space);
            
            // Record command in history
            await commandHistory(channelName).recordSlashCommand(
                { channelId: channelName },
                'ADD_FORMATION',
                {
                    spaceName,
                    formation,
                    oldState: initialState
                }
            );

            // Verify change
            const updatedSpace = await spaceManager(channelName).getSpace(spaceName);
            expect(updatedSpace.formations.length).toBe(1);
            expect(updatedSpace.formations[0]).toEqual(formation);

            // Undo the change
            const lastCommand = await commandHistory(channelName).getLastCommand();
            await spaceManager(channelName).updateSpace(spaceName, lastCommand.data.oldState);

            // Verify undo
            const finalSpace = await spaceManager(channelName).getSpace(spaceName);
            expect(finalSpace.formations.length).toBe(0);
        });
    });

    describe('Update Formation', () => {
        it('should update an existing formation', async () => {
            const spaceName = 'Paris';
            const space = await spaceManager(channelName).getSpace(spaceName);
            
            // First add a formation
            const initialFormation = {
                power: 'France',
                regularTroops: 4,
                secondaryTroops: 2,
                leaders: ['Francis I', 'Montmorency']
            };
            space.formations.push(initialFormation);
            await spaceManager(channelName).updateSpace(spaceName, space);

            // Store state before update
            const stateBeforeUpdate = { ...await spaceManager(channelName).getSpace(spaceName) };

            // Update formation
            const updatedFormation = {
                power: 'France',
                regularTroops: 6, // increased troops
                secondaryTroops: 3, // increased mercenaries
                leaders: ['Francis I'] // removed one leader
            };

            space.formations = [updatedFormation];
            await spaceManager(channelName).updateSpace(spaceName, space);
            
            // Record command in history
            await commandHistory(channelName).recordSlashCommand(
                { channelId: channelName },
                'UPDATE_FORMATION',
                {
                    spaceName,
                    oldState: stateBeforeUpdate,
                    newState: space
                }
            );

            // Verify change
            const updatedSpace = await spaceManager(channelName).getSpace(spaceName);
            expect(updatedSpace.formations[0]).toEqual(updatedFormation);

            // Undo the change
            const lastCommand = await commandHistory(channelName).getLastCommand();
            await spaceManager(channelName).updateSpace(spaceName, lastCommand.data.oldState);

            // Verify undo
            const finalSpace = await spaceManager(channelName).getSpace(spaceName);
            expect(finalSpace.formations[0]).toEqual(initialFormation);
        });
    });

    describe('Remove Formation', () => {
        it('should remove a formation from a space', async () => {
            const spaceName = 'Paris';
            const space = await spaceManager(channelName).getSpace(spaceName);
            
            // First add a formation
            const formation = {
                power: 'France',
                regularTroops: 4,
                secondaryTroops: 2,
                leaders: ['Francis I']
            };
            space.formations.push(formation);
            await spaceManager(channelName).updateSpace(spaceName, space);

            // Store state before removal
            const stateBeforeRemoval = { ...await spaceManager(channelName).getSpace(spaceName) };
            expect(stateBeforeRemoval.formations.length).toBe(1);

            // Remove formation
            space.formations = [];
            await spaceManager(channelName).updateSpace(spaceName, space);
            
            // Record command in history
            await commandHistory(channelName).recordSlashCommand(
                { channelId: channelName },
                'REMOVE_FORMATION',
                {
                    spaceName,
                    oldState: stateBeforeRemoval,
                    newState: space
                }
            );

            // Verify change
            const updatedSpace = await spaceManager(channelName).getSpace(spaceName);
            expect(updatedSpace.formations.length).toBe(0);

            // Undo the change
            const lastCommand = await commandHistory(channelName).getLastCommand();
            await spaceManager(channelName).updateSpace(spaceName, lastCommand.data.oldState);

            // Verify undo
            const finalSpace = await spaceManager(channelName).getSpace(spaceName);
            expect(finalSpace.formations.length).toBe(1);
            expect(finalSpace.formations[0]).toEqual(formation);
        });
    });
}); 
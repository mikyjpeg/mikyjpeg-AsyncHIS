const fs = require('fs').promises;
const path = require('path');
const diplomacyManager = require('../src/game/diplomacyManager');
const rulerManager = require('../src/game/rulerManager');
const { commandHistory } = require('../src/game/commandHistoryManager');

describe('Diplomacy Commands', () => {
    const gameId = 'test1234';
    const channelName = `${gameId}_test`;
    
    // Setup: Create necessary directories and files before tests
    beforeAll(async () => {
        const gameDir = path.join(process.cwd(), 'data', 'games', gameId);
        const dirs = ['factions', 'rulers'];
        
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

        // Create initial ruler data
        const rulers = [
            {
                name: 'Francis I',
                faction: 'France',
                isCurrentRuler: true,
                excommunicated: false
            },
            {
                name: 'Suleiman',
                faction: 'Ottoman',
                isCurrentRuler: true,
                excommunicated: false
            }
        ];

        for (const ruler of rulers) {
            await fs.writeFile(
                path.join(gameDir, 'rulers', `${ruler.name.toLowerCase().replace(/\s+/g, '_')}.json`),
                JSON.stringify(ruler, null, 2)
            );
        }
    });

    // Cleanup: Remove test data after all tests
    afterAll(async () => {
        const gameDir = path.join(process.cwd(), 'data', 'games', gameId);
        await fs.rm(gameDir, { recursive: true, force: true });
    });

    describe('Excommunication', () => {
        it('should excommunicate a ruler and affect faction card modifier', async () => {
            const rulerName = 'Francis I';
            const ruler = await rulerManager(channelName).getRuler(rulerName);
            const faction = await diplomacyManager(channelName).getFaction(ruler.faction);
            
            // Store initial states
            const initialRulerState = { ...ruler };
            const initialFactionState = { ...faction };
            expect(ruler.excommunicated).toBe(false);
            expect(faction.cardModifier).toBe(0);

            // Excommunicate ruler
            ruler.excommunicated = true;
            await rulerManager(channelName).updateRuler(rulerName, ruler);

            // Update faction card modifier
            faction.cardModifier = -1;
            await diplomacyManager(channelName).updateFaction(ruler.faction, faction);
            
            // Record command in history
            await commandHistory(channelName).recordSlashCommand(
                { channelId: channelName },
                'EXCOMMUNICATION',
                {
                    ruler: {
                        name: rulerName,
                        faction: ruler.faction,
                        oldState: initialRulerState
                    },
                    faction: {
                        name: ruler.faction,
                        oldState: initialFactionState
                    }
                }
            );

            // Verify changes
            const updatedRuler = await rulerManager(channelName).getRuler(rulerName);
            const updatedFaction = await diplomacyManager(channelName).getFaction(ruler.faction);
            expect(updatedRuler.excommunicated).toBe(true);
            expect(updatedFaction.cardModifier).toBe(-1);

            // Undo the changes
            const lastCommand = await commandHistory(channelName).getLastCommand();
            await rulerManager(channelName).updateRuler(rulerName, lastCommand.data.ruler.oldState);
            await diplomacyManager(channelName).updateFaction(ruler.faction, lastCommand.data.faction.oldState);

            // Verify undo
            const finalRuler = await rulerManager(channelName).getRuler(rulerName);
            const finalFaction = await diplomacyManager(channelName).getFaction(ruler.faction);
            expect(finalRuler.excommunicated).toBe(false);
            expect(finalFaction.cardModifier).toBe(0);
        });
    });

    describe('Declare War', () => {
        it('should declare war between two factions', async () => {
            const faction1Name = 'France';
            const faction2Name = 'Ottoman';
            
            const faction1 = await diplomacyManager(channelName).getFaction(faction1Name);
            const faction2 = await diplomacyManager(channelName).getFaction(faction2Name);
            
            // Store initial states
            const initialState1 = { ...faction1 };
            const initialState2 = { ...faction2 };
            expect(faction1.atWar).not.toContain(faction2Name);
            expect(faction2.atWar).not.toContain(faction1Name);

            // Declare war
            faction1.atWar.push(faction2Name);
            faction2.atWar.push(faction1Name);
            await diplomacyManager(channelName).updateFaction(faction1Name, faction1);
            await diplomacyManager(channelName).updateFaction(faction2Name, faction2);
            
            // Record command in history
            await commandHistory(channelName).recordSlashCommand(
                { channelId: channelName },
                'DECLARE_WAR',
                {
                    faction1: {
                        name: faction1Name,
                        oldState: initialState1
                    },
                    faction2: {
                        name: faction2Name,
                        oldState: initialState2
                    }
                }
            );

            // Verify changes
            const updatedFaction1 = await diplomacyManager(channelName).getFaction(faction1Name);
            const updatedFaction2 = await diplomacyManager(channelName).getFaction(faction2Name);
            expect(updatedFaction1.atWar).toContain(faction2Name);
            expect(updatedFaction2.atWar).toContain(faction1Name);

            // Undo the changes
            const lastCommand = await commandHistory(channelName).getLastCommand();
            await diplomacyManager(channelName).updateFaction(faction1Name, lastCommand.data.faction1.oldState);
            await diplomacyManager(channelName).updateFaction(faction2Name, lastCommand.data.faction2.oldState);

            // Verify undo
            const finalFaction1 = await diplomacyManager(channelName).getFaction(faction1Name);
            const finalFaction2 = await diplomacyManager(channelName).getFaction(faction2Name);
            expect(finalFaction1.atWar).not.toContain(faction2Name);
            expect(finalFaction2.atWar).not.toContain(faction1Name);
        });
    });

    describe('Make Peace', () => {
        it('should make peace between two warring factions', async () => {
            const faction1Name = 'France';
            const faction2Name = 'Ottoman';
            
            // First set up war state
            const faction1 = await diplomacyManager(channelName).getFaction(faction1Name);
            const faction2 = await diplomacyManager(channelName).getFaction(faction2Name);
            faction1.atWar = [faction2Name];
            faction2.atWar = [faction1Name];
            await diplomacyManager(channelName).updateFaction(faction1Name, faction1);
            await diplomacyManager(channelName).updateFaction(faction2Name, faction2);

            // Store state before peace
            const stateBeforePeace1 = { ...await diplomacyManager(channelName).getFaction(faction1Name) };
            const stateBeforePeace2 = { ...await diplomacyManager(channelName).getFaction(faction2Name) };
            expect(stateBeforePeace1.atWar).toContain(faction2Name);
            expect(stateBeforePeace2.atWar).toContain(faction1Name);

            // Make peace
            faction1.atWar = faction1.atWar.filter(f => f !== faction2Name);
            faction2.atWar = faction2.atWar.filter(f => f !== faction1Name);
            await diplomacyManager(channelName).updateFaction(faction1Name, faction1);
            await diplomacyManager(channelName).updateFaction(faction2Name, faction2);
            
            // Record command in history
            await commandHistory(channelName).recordSlashCommand(
                { channelId: channelName },
                'MAKE_PEACE',
                {
                    faction1: {
                        name: faction1Name,
                        oldState: stateBeforePeace1
                    },
                    faction2: {
                        name: faction2Name,
                        oldState: stateBeforePeace2
                    }
                }
            );

            // Verify changes
            const updatedFaction1 = await diplomacyManager(channelName).getFaction(faction1Name);
            const updatedFaction2 = await diplomacyManager(channelName).getFaction(faction2Name);
            expect(updatedFaction1.atWar).not.toContain(faction2Name);
            expect(updatedFaction2.atWar).not.toContain(faction1Name);

            // Undo the changes
            const lastCommand = await commandHistory(channelName).getLastCommand();
            await diplomacyManager(channelName).updateFaction(faction1Name, lastCommand.data.faction1.oldState);
            await diplomacyManager(channelName).updateFaction(faction2Name, lastCommand.data.faction2.oldState);

            // Verify undo
            const finalFaction1 = await diplomacyManager(channelName).getFaction(faction1Name);
            const finalFaction2 = await diplomacyManager(channelName).getFaction(faction2Name);
            expect(finalFaction1.atWar).toContain(faction2Name);
            expect(finalFaction2.atWar).toContain(faction1Name);
        });
    });
}); 
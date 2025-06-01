const fs = require('fs').promises;
const path = require('path');

const SEA_ZONES = [
    'North Sea',
    'English Channel',
    'Baltic Sea',
    'Irish Sea',
    'Bay of Biscay',
    'Atlantic Ocean',
    'Barbary Coast',
    'Gulf of Lyon',
    'Tyrrhenian Sea',
    'North African Coast',
    'Ionian Sea',
    'Adriatic Sea',
    'Aegean Sea',
    'Black Sea'
];

const NAVAL_POWERS = ['Hapsburg', 'France', 'Papacy', 'Ottoman', 'Venice', 'Genoa', 'Scotland'];

async function createSeaZoneFiles() {
    try {
        // Create data/seazones directory if it doesn't exist
        const seazonesDir = path.join(__dirname, '../data/seazones');
        await fs.mkdir(seazonesDir, { recursive: true });

        // Create a JSON file for each sea zone
        for (const zoneName of SEA_ZONES) {
            // Create fleets array with one object per naval power
            const fleets = NAVAL_POWERS.map(power => {
                const fleet = {
                    owningPower: power,
                    squadrons: 0,
                    interceptable: false,
                    leaders: []
                };

                // Add corsairs field for Ottoman
                if (power === 'Ottoman') {
                    fleet.corsairs = 0;
                }

                return fleet;
            });

            const zoneData = {
                name: zoneName,
                adjacentZones: [],
                ports: [],
                fleets: fleets,
                hasPiracyToken: false
            };

            // Create a safe filename
            const fileName = `${zoneName.toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')  // Replace any non-alphanumeric chars with underscore
                .replace(/^_+|_+$/g, '')      // Remove leading/trailing underscores
            }.json`;
            
            const filePath = path.join(seazonesDir, fileName);
            
            await fs.writeFile(filePath, JSON.stringify(zoneData, null, 2));
            console.log(`Created sea zone file: ${fileName}`);
        }

        console.log('All sea zone files have been created successfully!');
    } catch (error) {
        console.error('Error creating sea zone files:', error);
        if (error.record) {
            console.error('Problem record:', error.record);
        }
    }
}

createSeaZoneFiles(); 
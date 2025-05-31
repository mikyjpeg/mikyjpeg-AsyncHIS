const formationManager = require('../src/game/formationManager');

async function testFormations() {
    try {
        console.log('Testing Ottoman formation in Istanbul:');
        const istanbul1 = await formationManager.addFormation('Istanbul', 'Ottoman', 5, 3, ['Suleiman', 'Ibrahim']);
        console.log('Added Ottoman formation:', istanbul1.formations[0]);

        console.log('\nTesting French formation in Paris:');
        const paris1 = await formationManager.addFormation('Paris', 'France', 4, 2, ['Francis I', 'Montmorency']);
        console.log('Added French formation:', paris1.formations[0]);

        console.log('\nAdding more troops to existing Ottoman formation:');
        const istanbul2 = await formationManager.addFormation('Istanbul', 'Ottoman', 3, 2, ['Barbarossa']);
        console.log('Updated Ottoman formation:', istanbul2.formations[0]);

        console.log('\nRemoving some troops from French formation:');
        const paris2 = await formationManager.removeFormation('Paris', 'France', 2, 1, ['Montmorency']);
        console.log('Updated French formation:', paris2.formations[0]);

        // Test error cases
        console.log('\nTesting error cases:');
        
        try {
            // Try to add cavalry to French formation
            await formationManager.addFormation('Paris', 'France', 2, 1, [], true);
        } catch (error) {
            console.log('Expected error:', error.message);
        }

        try {
            // Try to add mercenaries to Ottoman formation
            const formation = {
                power: 'Ottoman',
                regulars: 2,
                mercenaries: 1,
                cavalry: 0,
                leaders: []
            };
            await formationManager.validateFormation(formation);
        } catch (error) {
            console.log('Expected error:', error.message);
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testFormations(); 
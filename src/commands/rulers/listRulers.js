const fs = require('fs').promises;
const path = require('path');

module.exports = {
    name: 'list_rulers',
    description: 'List all rulers and their excommunication status',
    usage: '!list_rulers [faction?]',
    async execute(message, args) {
        const rulersDir = path.join(__dirname, '../../../data/rulers');
        const files = await fs.readdir(rulersDir);
        
        let rulers = await Promise.all(
            files
                .filter(f => f.endsWith('.json'))
                .map(async f => {
                    const data = await fs.readFile(path.join(rulersDir, f), 'utf8');
                    return JSON.parse(data);
                })
        );

        // If faction is specified, filter by faction
        if (args.length > 0) {
            const faction = args.join(' ');
            rulers = rulers.filter(r => r.faction.toLowerCase() === faction.toLowerCase());
            if (rulers.length === 0) {
                return `No rulers found for faction: ${faction}`;
            }
        }

        // Sort rulers by faction
        rulers.sort((a, b) => a.faction.localeCompare(b.faction));

        // Format the output
        let output = 'Rulers:\n';
        let currentFaction = '';
        
        for (const ruler of rulers) {
            if (ruler.faction !== currentFaction) {
                output += `\n${ruler.faction}:\n`;
                currentFaction = ruler.faction;
            }
            output += `  - ${ruler.name}${ruler.excommunicated ? ' (Excommunicated)' : ''}${ruler.isCurrentRuler ? ' (Current)' : ''}\n`;
        }

        return output;
    }
}; 
const https = require('https');

https.get('https://restcountries.com/v3.1/all?fields=name,idd,flags,cca2', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        const countries = [];
        
        for (const c of json) {
            if (!c.idd || !c.idd.root) continue;
            // Some countries have multiple suffixes, e.g. USA has +1, Puerto Rico +1 787
            // Just take the first suffix or root
            const suffix = c.idd.suffixes && c.idd.suffixes.length > 0 ? c.idd.suffixes[0] : '';
            let dial = c.idd.root + suffix;
            // E.g. USA root +1, suffix ""
            // Russia root +7, suffix "840" ? wait, restcountries format:
            // root: "+1", suffixes: ["242", "246"...]
            // actually if there are many suffixes (like USA), let's just use root for US.
            if (c.cca2 === 'US' || c.cca2 === 'CA') dial = '+1';
            else if (c.cca2 === 'RU' || c.cca2 === 'KZ') dial = '+7';
            else dial = c.idd.root + (c.idd.suffixes && c.idd.suffixes.length === 1 ? c.idd.suffixes[0] : '');
            
            // convert cca2 to emoji flag
            const flag = c.cca2.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
            
            countries.push({
                code: c.cca2,
                dial: dial,
                flag: flag,
                name: c.name.common
            });
        }
        
        // Sort alphabetically but put IN first
        countries.sort((a, b) => a.name.localeCompare(b.name));
        const indIndex = countries.findIndex(c => c.code === 'IN');
        if (indIndex !== -1) {
            const ind = countries.splice(indIndex, 1)[0];
            countries.unshift(ind);
        }
        
        // Output as JS string
        console.log("const COUNTRIES = " + JSON.stringify(countries, null, 4) + ";");
    });
});

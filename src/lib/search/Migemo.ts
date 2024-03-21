import { CompactDictionary, Migemo } from 'jsmigemo';

export async function makeMigemoRegexes(searchWord: string): Promise<RegExp[]> {
    if (searchWord.length === 0) {
        return [];
    }

    const searchWords = searchWord.split(/\s+/).filter((w) => w.length > 0);
    const results = [];
    for (const word of searchWords) {
        const re = await migemoQuery(word.toLowerCase());
        results.push(new RegExp(re.replace(/\(/g, '(?:')));
    }
    return results;
}

let migemo: Migemo | null = null;

async function migemoQuery(query: string): Promise<string> {
    if (!migemo) {
        console.log('Loading migemo dictionary');
        const e = await fetch(
            '/assets/yet-another-migemo-dict/migemo-compact-dict',
        );
        if (e.ok) {
            const dict = new CompactDictionary(await e.arrayBuffer());
            migemo = new Migemo();
            migemo.setDict(dict);
        } else {
            throw new Error('Failed to load migemo dictionary');
        }
    }

    return migemo.query(query);
}

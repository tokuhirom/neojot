import { invoke } from '@tauri-apps/api/core';

export async function makeMigemoRegexes(searchWord: string): Promise<RegExp[]> {
    if (searchWord.length === 0) {
        return [];
    }

    const searchWords = searchWord.split(/\s+/);
    const results = [];
    for (const word of searchWords) {
        const re = (await invoke('gen_migemo_regex', {
            word: word.toLowerCase(),
        })) as string;
        results.push(new RegExp(re.replace(/\(/g, '(?:')));
    }
    return results;
}

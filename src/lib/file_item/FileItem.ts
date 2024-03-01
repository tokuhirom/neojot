export type MatchedLine = {
    content: string;
    lineNumber: number;
};

export type FileItem = {
    filename: string;
    mtime: number;
    title: string;
    content: string;
};

export function extractTitle(content: string) {
    const lines = content.split('\n');
    if (lines.length >= 1) {
        const title = lines[0].replace(/^#+\s*/, '');
        // if title includes non-whitespace characters, return it.
        if (/\S/.test(title)) {
            return title;
        }
        // check remaining lines, and return first non-empty line.
        for (const line of lines.slice(1)) {
            if (/\S/.test(line)) {
                return line;
            }
        }
        return '';
    } else {
        return '';
    }
}

export function shouldShowFileItem(
    fileItem: FileItem,
    searchWord: string,
): boolean {
    if (searchWord.length == 0) {
        return true;
    }

    const lowerCaseSearchWord = searchWord.toLowerCase();
    const lowerCaseTitle = fileItem.title.toLowerCase();
    const lowerCaseContent = fileItem.content.toLowerCase();

    const words = lowerCaseSearchWord
        .split(/\s+/)
        .filter((it) => it.length > 0);
    let result = true;
    for (const word of words) {
        if (
            !lowerCaseTitle.includes(word) &&
            !lowerCaseContent.includes(word)
        ) {
            result = false;
            break;
        }
    }
    return result;
}

export function extractBrackets(content: string): string[] {
    const pattern = /\[\[(.*?)]]/g;
    const matches = [];
    let match;

    while ((match = pattern.exec(content)) !== null) {
        matches.push(match[1]);
    }

    return matches;
}

type CacheEntry = {
    mtime: number;
    links: string[];
};

const cache: Record<string, CacheEntry> = {};

export function extractBracketsWithCache(fileItem: FileItem) {
    const r = cache[fileItem.filename];
    if (r && r.mtime === fileItem.mtime) {
        return r.links;
    } else {
        const links = extractBrackets(fileItem.content);
        cache[fileItem.filename] = {
            mtime: fileItem.mtime,
            links: links,
        };
        return links;
    }
}

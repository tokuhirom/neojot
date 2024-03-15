import type { FileItem } from './FileItem';

type AliaslinkCacheItem = {
    mtime: number;
    autolinks: string[];
};
const aliaslinkCache = new Map<string, AliaslinkCacheItem>();
export function cachedExtractAliases(fileItem: FileItem): string[] {
    const cache = aliaslinkCache.get(fileItem.filename);
    if (cache && cache.mtime === fileItem.mtime) {
        return cache.autolinks;
    }
    const autolinks = extractAliases(fileItem);
    aliaslinkCache.set(fileItem.filename, {
        mtime: fileItem.mtime,
        autolinks,
    });
    return autolinks;
}

function extractAliases(fileItem: FileItem): string[] {
    const content = fileItem.content;
    const pattern = /^ALIAS:\s+(.+?)$/gm;
    const matches = [];
    let match;
    while ((match = pattern.exec(content)) !== null) {
        matches.push(match[1]);
    }
    return matches;
}

type AutolinkCacheItem = {
    mtime: number;
    autolinks: string[];
};

const autolinkCache = new Map<string, AutolinkCacheItem>();
export function cachedExtractAutoLinks(fileItem: FileItem): string[] {
    const cache = autolinkCache.get(fileItem.filename);
    if (cache && cache.mtime === fileItem.mtime) {
        return cache.autolinks;
    }
    const autolinks = extractAutolinks(fileItem);
    autolinkCache.set(fileItem.filename, {
        mtime: fileItem.mtime,
        autolinks,
    });
    return autolinks;
}

function extractAutolinks(fileItem: FileItem): string[] {
    const content = fileItem.content;
    const pattern = /^AUTOLINK:\s+(.+?)$/gm;
    const matches = [];
    let match;
    while ((match = pattern.exec(content)) !== null) {
        matches.push(match[1]);
    }
    return matches;
}

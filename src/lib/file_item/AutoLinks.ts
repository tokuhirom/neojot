import type { FileItem } from './FileItem';

type CacheItem = {
    mtime: number;
    links: string[];
};

const cache = new Map<string, CacheItem>();

export function cachedExtractLinks(
    fileItem: FileItem,
    type: 'ALIAS' | 'AUTOLINK',
): string[] {
    const cacheKey = `${fileItem.filename}-${type}`;
    const cachedItem = cache.get(cacheKey);
    if (cachedItem && cachedItem.mtime === fileItem.mtime) {
        return cachedItem.links;
    }
    const links = extractLinks(fileItem, type);
    cache.set(cacheKey, {
        mtime: fileItem.mtime,
        links,
    });
    return links;
}

function extractLinks(
    fileItem: FileItem,
    type: 'ALIAS' | 'AUTOLINK',
): string[] {
    const content = fileItem.content;
    const pattern = new RegExp(`^${type}:\\s+(.+?)$`, 'gm');
    const matches = [];
    let match;
    while ((match = pattern.exec(content)) !== null) {
        matches.push(match[1]);
    }
    return matches;
}

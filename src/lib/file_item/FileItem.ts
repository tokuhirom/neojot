import { BaseDirectory, readFile } from '@tauri-apps/plugin-fs';
import { uint8ArrayToDataUrl } from '../markdown/ImageViewWidget';
import { invoke } from '@tauri-apps/api/core';

export type MatchedLine = {
    content: string;
    lineNumber: number | undefined;
};

export type FileItem = {
    filename: string;
    mtime: number;
    title: string;
    content: string;
};

export function extractBrackets(content: string): string[] {
    const pattern = /\[\[([^|]+?)]]/g;
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

const bracketCache: Record<string, CacheEntry> = {};

export function extractBracketsWithCache(fileItem: FileItem) {
    const r = bracketCache[fileItem.filename];
    if (r && r.mtime === fileItem.mtime) {
        return r.links;
    } else {
        const links = extractBrackets(fileItem.content);
        bracketCache[fileItem.filename] = {
            mtime: fileItem.mtime,
            links: links,
        };
        return links;
    }
}

type ImageCacheItem = {
    mtime: number;
    imgSrc: string | undefined;
};
const imageCache = new Map<string, ImageCacheItem>();

export async function cachedLoadImage(
    fileItem: FileItem,
): Promise<string | undefined> {
    const cacheItem = imageCache.get(fileItem.filename);
    if (cacheItem && cacheItem.mtime === fileItem.mtime) {
        return cacheItem.imgSrc;
    } else {
        const imgSrc = await loadImage(fileItem);
        imageCache.set(fileItem.filename, {
            mtime: fileItem.mtime,
            imgSrc,
        });
        return imgSrc;
    }
}

// TODO: load image by <img> tag.
// see https://github.com/tauri-apps/tauri/discussions/1438
async function loadImage(fileItem: FileItem): Promise<string | undefined> {
    const match = fileItem.content.match(/!\[.*]\((.*)\)/);
    if (match) {
        const url = match[1];
        const value = await readFile(url.replace('../', ''), {
            baseDir: BaseDirectory.AppData,
        });
        return await uint8ArrayToDataUrl(value);
    } else {
        return undefined;
    }
}

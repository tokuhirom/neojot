import { BaseDirectory, readFile } from '@tauri-apps/plugin-fs';
import { uint8ArrayToDataUrl } from '../markdown/ImageViewWidget';

export type MatchedLine = {
    content: string;
    lineNumber: number | undefined;
};

export type FileItem = {
    filename: string;
    mtime: number;
    title: string;
    content: string;
    // undefined: image is not loaded yet.
    // string: image is loaded. content is the data URL.
    // null: image is not included in this note.
    imgSrc: string | null | undefined;
};

export function extractBrackets(content: string): string[] {
    const pattern = /\[\[([^`|]+?)]]/g;
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

// see https://github.com/tauri-apps/tauri/discussions/1438
export async function loadImage(fileItem: FileItem): Promise<string | null> {
    // ![[../images/20240325094802.jpg|100]] のパターンもサポートしたい。
    const match = fileItem.content.match(
        /!\[.*]\((.*)\)|!\[\[([^|]+)(?:\|[0-9-]+)?]]/,
    );
    if (match) {
        const url = match[1] || match[2];
        console.log(`Loading image source ${url}`);
        const value = await readFile(url.replace('../', ''), {
            baseDir: BaseDirectory.AppData,
        });
        return await uint8ArrayToDataUrl(value);
    } else {
        return null;
    }
}

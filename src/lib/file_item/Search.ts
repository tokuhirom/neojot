import { type FileItem, type MatchedLine } from './FileItem';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import { getExcalidrawTexts } from '../excalidraw/ExcalidrawUtils';

export type SearchResult = {
    lines: MatchedLine[];
    fileItem: FileItem;
};

export function searchFileItems(
    fileItems: FileItem[],
    searchWord: string,
    regExps: RegExp[] | undefined,
): SearchResult[] {
    if (searchWord.length === 0 || !regExps) {
        return fileItems.map((fileItem) => {
            return { lines: [], fileItem };
        });
    } else {
        return fileItems
            .map((fileItem) => {
                const lines = searchLinesByWord(fileItem, searchWord, regExps);
                if (lines) {
                    return { lines, fileItem } as SearchResult;
                } else {
                    return undefined;
                }
            })
            .filter((result) => result) as SearchResult[];
    }
}

function searchLinesByWord(
    fileItem: FileItem,
    searchWord: string,
    regExps: RegExp[],
): MatchedLine[] | undefined {
    if (searchWord.length > 0) {
        if (fileItem.filename.endsWith('.excalidraw')) {
            return searchExcalidrawFile(fileItem, regExps);
        } else {
            return searchMarkdownFile(fileItem, searchWord, regExps);
        }
    } else {
        // without search word, there's no matched lines.
        return [];
    }
}

function searchExcalidrawFile(
    fileItem: FileItem,
    regExps: RegExp[] | undefined,
): MatchedLine[] | undefined {
    const lines: MatchedLine[] = [];
    const json = fileItem.content;
    const excalidraw = JSON.parse(json);
    const elements = excalidraw.elements as ExcalidrawElement[];
    const texts: string[] = getExcalidrawTexts(elements);
    texts.filter((text) => {
        if (regExps.some((regex) => regex.test(text.toLowerCase()))) {
            lines.push({
                content: text,
                lineNumber: undefined,
            } as MatchedLine);
        }
    });
    if (lines.length > 0) {
        return lines;
    } else {
        return undefined;
    }
}

function searchMarkdownFile(
    fileItem: FileItem,
    searchWord: string,
    regExps: RegExp[],
): MatchedLine[] | undefined {
    const contentLines = fileItem.content.split(/\n/);
    const lines = contentLines
        .map((line, index) => {
            if (regExps.some((regex) => regex.test(line.toLowerCase()))) {
                return {
                    content: line,
                    lineNumber: index + 1,
                } as MatchedLine;
            } else {
                return undefined;
            }
        })
        .filter((it) => it !== undefined) as MatchedLine[];

    if (lines.length > 0) {
        return lines.filter(
            (line) =>
                !(
                    line.content.startsWith('# ') ||
                    line.content.startsWith('<<< ')
                ),
        );
    } else {
        return undefined;
    }
}

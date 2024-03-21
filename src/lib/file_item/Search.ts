import { type FileItem, type MatchedLine } from './FileItem';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import { getExcalidrawTexts } from '../excalidraw/ExcalidrawUtils';

export type SearchResult = {
    lines: MatchedLine[];
    fileItem: FileItem;
};

export function searchFileItems(
    fileItems: FileItem[],
    regExps: RegExp[] | undefined,
): SearchResult[] {
    if (regExps == undefined) {
        return fileItems.map((fileItem) => {
            return { lines: [], fileItem };
        });
    } else {
        return fileItems
            .map((fileItem) => {
                const lines = searchLinesByWord(fileItem, regExps);
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
    regExps: RegExp[],
): MatchedLine[] | undefined {
    if (regExps.length > 0) {
        if (fileItem.filename.endsWith('.excalidraw')) {
            return searchExcalidrawFile(fileItem, regExps);
        } else {
            return searchMarkdownFile(fileItem, regExps);
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

// if there's no matched lines, return undefined.
function searchMarkdownFile(
    fileItem: FileItem,
    regExps: RegExp[],
): MatchedLine[] | undefined {
    const contentLines = fileItem.content.split(/\n/);
    // matches all keywords?
    if (!regExps.every((regex) => regex.test(fileItem.content.toLowerCase()))) {
        return undefined;
    }

    const lines = contentLines
        .map((line, index) => {
            // find the line, that is matched to one of the keyword.
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
        // タイトル行は、タイトル行としてすでに表示されるので除外する
        // ALIAS, AUTOLINK も表示されても意味ないので除外
        return lines.filter(
            (line) =>
                !(
                    line.content.startsWith('# ') ||
                    line.content.startsWith('ALIAS:') ||
                    line.content.startsWith('AUTOLINK:')
                ),
        );
    } else {
        return undefined;
    }
}

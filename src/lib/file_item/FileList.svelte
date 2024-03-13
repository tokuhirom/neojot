<script lang="ts">
    import FileListItem from './FileListItem.svelte';
    import {
        type FileItem,
        type MatchedLine,
        shouldShowFileItem,
    } from './FileItem';
    import { makeMigemoRegexes } from '../search/Migemo';
    import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
    import { getExcalidrawTexts } from '../excalidraw/ExcalidrawUtils';

    export let onSelectItem: (fileItem: FileItem | undefined) => void;
    export let dataFileItems: FileItem[] = [];
    export let selectedItem: FileItem | undefined = undefined;
    export let viewerMode: boolean = false;
    export let enterViewerMode: () => void = () => {};
    export let searchWord = '';

    type SearchResult = {
        lines: MatchedLine[];
        fileItem: FileItem;
    };

    let searchResult: SearchResult[];

    $: if (dataFileItems || migemoRegexes) {
        searchFileItems()
            .then((r) => {
                searchResult = r;
            })
            .catch((e) => {
                console.error('Cannot update search result', e);
            });
    }

    let migemoRegexes: RegExp[] = [];
    $: makeMigemoRegexes(searchWord)
        .then((r) => {
            migemoRegexes = r;
        })
        .catch((e) => {
            console.error('Cannot update migemo regexes', e);
        });

    async function searchFileItems(): Promise<SearchResult[]> {
        const r: SearchResult[] = [];
        for (const fileItem of dataFileItems) {
            if (shouldShowFileItem(fileItem, searchWord, migemoRegexes)) {
                const lines: MatchedLine[] = await searchLinesByWord(
                    fileItem,
                    searchWord,
                    migemoRegexes,
                );
                r.push({ lines: lines, fileItem });
            }
        }
        return r;
    }

    async function searchLinesByWord(
        fileItem: FileItem,
        searchWord: string,
        migemoRegexes: RegExp[],
    ) {
        const lines: MatchedLine[] = [];
        if (searchWord.length > 0) {
            if (fileItem.filename.endsWith('.excalidraw')) {
                const json = fileItem.content;
                const excalidraw = JSON.parse(json);
                const elements = excalidraw.elements as ExcalidrawElement[];
                const texts: string[] = getExcalidrawTexts(elements);
                texts.filter((text) => {
                    if (
                        migemoRegexes.some((regex) =>
                            regex.test(text.toLowerCase()),
                        )
                    ) {
                        lines.push({
                            content: text,
                            lineNumber: undefined,
                        } as MatchedLine);
                    }
                });
            } else {
                const contentLines = fileItem.content.split(/\n/);
                contentLines.filter((line, index) => {
                    if (
                        migemoRegexes.some((regex) =>
                            regex.test(line.toLowerCase()),
                        ) &&
                        !(
                            (line.startsWith('# ') ||
                                line.startsWith('<<< ')) &&
                            line
                                .toLowerCase()
                                .includes(searchWord.toLowerCase())
                        )
                    ) {
                        lines.push({
                            content: line,
                            lineNumber: index + 1,
                        } as MatchedLine);
                    }
                });
            }
        }
        return lines;
    }
</script>

<div>
    {#if searchResult && selectedItem}
        {#each searchResult as result}
            <FileListItem
                {onSelectItem}
                fileItem={result.fileItem}
                matchLines={result.lines}
                {searchWord}
                {migemoRegexes}
                {selectedItem}
                {enterViewerMode}
                {viewerMode}
            />
        {/each}
    {/if}
</div>

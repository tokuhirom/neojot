<script lang="ts">
    import EntryView from '../markdown/EntryView.svelte';
    import FileListItem from '../file_item/FileListItem.svelte';
    import {
        type FileItem,
        type MatchedLine,
        shouldShowFileItem,
    } from '../file_item/FileItem';
    import LinkCards from '../link/LinkCards.svelte';
    import ClearableSearchBox from '../search/ClearableSearchBox.svelte';
    import {
        calculateFreshness,
        extractTasks,
        sortTasks,
        type Task,
    } from '../task/Task';
    import { onDestroy, onMount } from 'svelte';
    import TaskItem from '../task/TaskItem.svelte';
    import { emit } from '@tauri-apps/api/event';
    import ExcalidrawView from '../excalidraw/ExcalidrawView.svelte';
    import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
    import { getExcalidrawTexts } from '../excalidraw/ExcalidrawUtils';
    import { invoke } from '@tauri-apps/api/core';

    export let allFileItems: FileItem[] = [];
    export let dataFileItems: FileItem[] = [];
    export let selectedItem: FileItem | undefined = undefined;
    export let onSelectItem: (fileItem: FileItem | undefined) => void;
    export let title2fileItem: Record<string, FileItem>;
    export let comefromLinks: Record<string, FileItem>;
    let tasks: Task[] = [];
    let viewerMode = false;

    function handleKeydown(event) {
        if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
            return;
        }
        if (!viewerMode) {
            return;
        }

        switch (event.key) {
            case 'ArrowDown':
                // カーソル下キーが押された時の処理
                console.log('Cursor down pressed');
                if (selectedItem) {
                    // selectedItem を dataFileItems の次の要素に変更する
                    const index = dataFileItems.indexOf(selectedItem);
                    if (index < dataFileItems.length - 1) {
                        onSelectItem(dataFileItems[index + 1]);
                    }
                }
                break;
            case 'ArrowUp':
                // カーソル上キーが押された時の処理
                console.log('Cursor up pressed');
                if (selectedItem) {
                    // selectedItem を dataFileItems の前の要素に変更する
                    const index = dataFileItems.indexOf(selectedItem);
                    if (index > 0) {
                        onSelectItem(dataFileItems[index - 1]);
                    }
                }
                break;
        }
    }

    onMount(() => {
        window.addEventListener('keydown', handleKeydown);
    });

    onDestroy(() => {
        window.removeEventListener('keydown', handleKeydown);
    });

    onMount(() => {
        updateTasks();
    });
    $: if (dataFileItems) {
        updateTasks();
    }

    function updateTasks() {
        const today = new Date();
        tasks = sortTasks(extractTasks(dataFileItems)).filter((task) => {
            return calculateFreshness(task, today) >= 0;
        });
    }

    type SearchResult = {
        lines: MatchedLine[];
        fileItem: FileItem;
    };

    let searchResult: SearchResult[];

    let searchWord = '';

    function searchLinesByWord(fileItem: FileItem, searchWord: string) {
        const lines: MatchedLine[] = [];
        if (searchWord.length > 0) {
            const contentLines = fileItem.content.split(/\n/);
            const lowerWords = searchWord.toLowerCase().split(/\s+/);
            if (fileItem.filename.endsWith('.excalidraw.md')) {
                // ```json から ``` までの間に入っている JSON を取り出して parse する
                const json = fileItem.content.match(
                    /```json\n([\s\S]+?)\n```/m,
                )?.[1];
                console.log(json);
                const excalidraw = JSON.parse(json);
                const elements = excalidraw.elements as ExcalidrawElement[];
                const texts: string[] = getExcalidrawTexts(elements);
                texts.filter((text) => {
                    if (
                        lowerWords.some((word) =>
                            text.toLowerCase().includes(word),
                        )
                    ) {
                        lines.push({
                            content: text,
                            lineNumber: undefined,
                        } as MatchedLine);
                    }
                });
            } else {
                contentLines.filter((line, index) => {
                    if (
                        lowerWords.some((word) =>
                            line.toLowerCase().includes(word),
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

    $: if (dataFileItems || searchWord) {
        searchFileItems().then((r) => {
            searchResult = r;
        });
    }

    async function searchFileItems(): Promise<SearchResult[]> {
        const r: SearchResult[] = [];
        const migemoWords = searchWord.split(/\s+/).map(
            async (word) =>
                await invoke('gen_migemo_regex', {
                    word: word.toLowerCase(),
                }),
        );
        console.log(migemoWords);
        dataFileItems.forEach((fileItem) => {
            if (shouldShowFileItem(fileItem, searchWord)) {
                const lines: MatchedLine[] = searchLinesByWord(
                    fileItem,
                    searchWord,
                );
                r.push({ lines: lines, fileItem });
            }
        });
        return r;
    }

    function onSaved() {
        selectedItem = selectedItem;
        updateTasks();
    }

    function onCreateItem(fileItem: FileItem) {
        viewerMode = false;
        dataFileItems.unshift(fileItem);
        allFileItems.unshift(fileItem);
        dataFileItems = dataFileItems;
        allFileItems = allFileItems;
        onSelectItem(fileItem);
    }

    function handleOnClick(task: Task) {
        onSelectItem(task.fileItem);
        viewerMode = false;
        emit('go-to-line-number', task.lineNumber);
    }

    function enterViewerMode() {
        viewerMode = true;
    }

    let fixedAreaHeight = 0; // 初期値を設定

    $: if (selectedItem) {
        const fixedAreaElement = document.querySelector(
            '.fixed-area',
        ) as HTMLElement | null;
        const clearableSearchBox = document.querySelector(
            '.clearable-search-box',
        ) as HTMLElement | null;
        if (fixedAreaElement && clearableSearchBox) {
            fixedAreaHeight =
                fixedAreaElement.offsetHeight + clearableSearchBox.offsetHeight;
        }
    }
</script>

<div class="list-view">
    <div
        class="file-list"
        on:blur={() => {
            viewerMode = false;
        }}
    >
        <div class="fixed-area">
            {#each tasks as task}
                <TaskItem {task} {handleOnClick} />
            {/each}
        </div>
        <div class="clearable-search-box">
            <ClearableSearchBox bind:searchWord />
        </div>
        <div
            class="scrollable-area"
            style="height: calc(100vh - {fixedAreaHeight}px);"
        >
            {#if searchResult && selectedItem}
                {#each searchResult as result}
                    <FileListItem
                        {onSelectItem}
                        fileItem={result.fileItem}
                        matchLines={result.lines}
                        {searchWord}
                        {selectedItem}
                        {enterViewerMode}
                        {viewerMode}
                    />
                {/each}
            {/if}
        </div>
    </div>
    <!-- eslint-disable-next-line -->
    <div class="log-view" on:click={() => (viewerMode = false)}>
        {#if selectedItem !== undefined}
            {#if selectedItem.filename.endsWith('.excalidraw.md')}
                <ExcalidrawView {selectedItem} />
            {:else}
                <EntryView
                    file={selectedItem}
                    {allFileItems}
                    {onSelectItem}
                    {onSaved}
                    {onCreateItem}
                    {title2fileItem}
                    {comefromLinks}
                    search={(keyword) => (searchWord = keyword)}
                />
                <LinkCards
                    file={selectedItem}
                    {allFileItems}
                    {onSelectItem}
                    {onCreateItem}
                />
            {/if}
        {/if}
    </div>
</div>

<style>
    .list-view {
        display: flex; /* Enables Flexbox */
        flex-direction: row; /* Stack children vertically */
        height: 100vh;
        padding-left: 8px;
        padding-right: 8px;
    }

    .fixed-area {
        flex: 0 0 250px; /* Adjust width as needed */
        max-height: 30%;
        overflow-y: scroll; /* Ensures this area does not scroll */
        padding-right: 9px;
        padding-left: 4px;
    }

    .scrollable-area {
        flex: 1; /* Takes the remaining space */
        overflow-y: auto; /* Enables scrolling */
        /*height: calc(100vh - 300px); !* Adjust height accordingly *!*/
        min-height: 200px;
    }

    .file-list {
        flex: 0 0 250px;
        overflow-y: auto;
        padding-right: 9px;
        padding-left: 4px;
        overflow-x: hidden;
        word-break: break-word;
        white-space: normal;
    }

    .log-view {
        flex: 0 0 68%;
        /*overflow-x: hidden;*/
        padding-inline-start: 0;
        flex-grow: 1;
        margin-block-start: 0;
        margin-block-end: 0;
        height: 100vh;
        overflow-y: scroll;
    }
</style>

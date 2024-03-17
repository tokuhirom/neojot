<script lang="ts">
    import EntryView from '../markdown/EntryView.svelte';
    import { type FileItem } from '../file_item/FileItem';
    import LinkCards from '../link/LinkCards.svelte';
    import ClearableSearchBox from '../search/ClearableSearchBox.svelte';
    import { type Task } from '../task/Task';
    import { onDestroy, onMount } from 'svelte';
    import { emit } from '@tauri-apps/api/event';
    import ExcalidrawView from '../excalidraw/ExcalidrawView.svelte';
    import FileList from '../file_item/FileList.svelte';
    import { createNewFileWithContent } from '../repository/NodeRepository';
    import QuickPadView from './QuickPadView.svelte';

    export let allFileItems: FileItem[] = [];
    export let dataFileItems: FileItem[] = [];
    export let selectedItem: FileItem | undefined = undefined;
    export let onSelectItem: (fileItem: FileItem | undefined) => void;
    export let pageTitles: string[];
    export let findEntryByTitle: (title: string) => FileItem | undefined;
    export let autoLinks: string[];
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

    let searchWord = '';

    function onSaved() {
        selectedItem = selectedItem;
    }

    function onCreateItem(fileItem: FileItem) {
        viewerMode = false;
        dataFileItems.unshift(fileItem);
        allFileItems.unshift(fileItem);
        dataFileItems = dataFileItems;
        allFileItems = allFileItems;
        onSelectItem(fileItem);
    }

    function enterViewerMode() {
        viewerMode = true;
    }

    let fixedAreaHeight = 0; // 初期値を設定

    $: if (selectedItem) {
        updateFixedAreaHeight();
    }

    onMount(() => {
        requestAnimationFrame(() => {
            updateFixedAreaHeight();
        });
    });
    function updateFixedAreaHeight() {
        const clearableSearchBox = document.querySelector(
            '.clearable-search-box',
        ) as HTMLElement | null;
        if (clearableSearchBox) {
            fixedAreaHeight = clearableSearchBox.offsetHeight;
        }
    }

    function findOrCreateEntry(pageName: string) {
        const fileItem = findEntryByTitle(pageName);
        if (fileItem) {
            onSelectItem(fileItem);
            searchWord = pageName;
            return;
        }

        // create new entry
        console.log(
            `Page '${pageName}' is not found. Trying to create new entry...`,
        );
        createNewFileWithContent(`# ${pageName}\n\n`).then(
            (fileItem: FileItem) => {
                onCreateItem(fileItem);
                searchWord = pageName;
            },
        );
    }

    function openTask(task: Task) {
        onSelectItem(task.fileItem);
        viewerMode = false;
        emit('go-to-line-number', task.lineNumber);
    }
</script>

<div class="list-view">
    <div
        class="file-list"
        on:blur={() => {
            viewerMode = false;
        }}
    >
        <div class="clearable-search-box">
            <ClearableSearchBox bind:searchWord />
        </div>
        <div
            class="scrollable-area"
            style="height: calc(100vh - {fixedAreaHeight}px);"
        >
            <FileList
                {dataFileItems}
                {searchWord}
                {selectedItem}
                {onSelectItem}
                {viewerMode}
                {enterViewerMode}
            />
        </div>
    </div>
    <!-- eslint-disable-next-line -->
    <div class="log-view" on:click={() => (viewerMode = false)}>
        {#if selectedItem !== undefined}
            {#if selectedItem.filename.endsWith('.excalidraw')}
                <ExcalidrawView {selectedItem} />
            {:else}
                <EntryView
                    file={selectedItem}
                    {onSelectItem}
                    {onSaved}
                    {onCreateItem}
                    {pageTitles}
                    search={(keyword) => (searchWord = keyword)}
                    {findEntryByTitle}
                    {autoLinks}
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
    <div class="menu">
        <QuickPadView
            {findOrCreateEntry}
            {dataFileItems}
            {openTask}
            {findEntryByTitle}
        />
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

    .menu {
        flex: 0 0 250px;
        height: 100vh;
        overflow-y: scroll;
    }
</style>

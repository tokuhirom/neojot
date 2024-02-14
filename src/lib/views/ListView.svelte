<script lang="ts">
    import EntryView from '../markdown/EntryView.svelte';
    import FileListItem from '../file_item/FileListItem.svelte';
    import { type FileItem, shouldShowFileItem } from '../file_item/FileItem';
    import {
        archiveFile,
        loadFileList,
        loadMarkdownFile,
    } from '../repository/NodeRepository';
    import { onDestroy, onMount } from 'svelte';
    import { listen, type UnlistenFn } from '@tauri-apps/api/event';
    import LinkCards from '../link/LinkCards.svelte';
    import ClearableSearchBox from '../search/ClearableSearchBox.svelte';

    let fileItems: FileItem[] = [];

    let filteredFileItems: FileItem[];
    let selectedItem: FileItem | undefined;

    let searchWord = '';

    $: if (fileItems || searchWord) {
        filteredFileItems = fileItems.filter((it) =>
            shouldShowFileItem(it, searchWord),
        );
    }

    onMount(async () => {
        fileItems = await loadFileList('data');

        selectedItem = fileItems[0];
    });

    async function openEntry(fileItem: FileItem) {
        console.log(`open: ${fileItem.filename}`);
        // reload content from file system
        fileItem.content = await loadMarkdownFile(fileItem.filename);
        selectedItem = fileItem;
    }

    let unlistenCallbackPromises: Promise<UnlistenFn>[] = [];
    unlistenCallbackPromises.push(
        listen('sort_file_list', async () => {
            fileItems.sort((a, b) => b.mtime - a.mtime);
            fileItems = fileItems;
        }),
    );
    unlistenCallbackPromises.push(
        listen('do_created', async (event) => {
            const fileItem = event.payload as FileItem;
            console.log(`ListView.do_created: ${fileItem.filename}`);
            if (
                !fileItems.some((item) => item.filename === fileItem.filename)
            ) {
                fileItems.unshift(fileItem);
                selectedItem = fileItem;
            }
        }),
    );
    unlistenCallbackPromises.push(
        listen('do_archive', async () => {
            if (selectedItem) {
                console.log(`Archiving: ${selectedItem.filename}`);
                await archiveFile(selectedItem);
                fileItems = await loadFileList('data');
                selectedItem = fileItems[0];
            }
        }),
    );
    onDestroy(async () => {
        for (let unlistenCallbackPromise of unlistenCallbackPromises) {
            (await unlistenCallbackPromise)();
        }
    });
</script>

<div class="list-view">
    <div class="file-list">
        <ClearableSearchBox bind:searchWord />
        {#if filteredFileItems && selectedItem}
            {#each filteredFileItems as fileItem}
                <FileListItem {openEntry} {fileItem} {selectedItem} />
            {/each}
        {/if}
    </div>
    <div class="log-view">
        {#if selectedItem !== undefined}
            <EntryView file={selectedItem} {fileItems} {openEntry} />

            <LinkCards file={selectedItem} {fileItems} {openEntry} />
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

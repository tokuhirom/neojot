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

    export let allFileItems: FileItem[] = [];
    export let dataFileItems: FileItem[] = [];
    export let selectedItem: FileItem | undefined = undefined;
    export let onSelectItem: (fileItem: FileItem | undefined) => void;

    let filteredFileItems: FileItem[];

    let searchWord = '';

    $: if (dataFileItems || searchWord) {
        filteredFileItems = dataFileItems.filter((it) =>
            shouldShowFileItem(it, searchWord),
        );
    }
</script>

<div class="list-view">
    <div class="file-list">
        <ClearableSearchBox bind:searchWord />
        {#if filteredFileItems && selectedItem}
            {#each filteredFileItems as fileItem}
                <FileListItem {onSelectItem} {fileItem} {selectedItem} />
            {/each}
        {/if}
    </div>
    <div class="log-view">
        {#if selectedItem !== undefined}
            <EntryView file={selectedItem} {allFileItems} {onSelectItem} />
            <LinkCards file={selectedItem} {allFileItems} {onSelectItem} />
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

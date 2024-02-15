<script lang="ts">
    import { onMount } from 'svelte';
    import {
        deleteArchivedFile,
        loadFileList,
    } from '../repository/NodeRepository';
    import type { FileItem } from '../file_item/FileItem';
    import FileCardItem from '../card/FileCardItem.svelte';

    export let onSelectItem: (fileItem: FileItem | undefined) => void;
    export let selectedItem: FileItem | undefined = undefined;
    export let archivedFileItems: FileItem[] = [];

    function onSelect(fileItem: FileItem) {
        onSelectItem(fileItem);
    }

    async function deleteSelectedEntry() {
        if (selectedItem) {
            await deleteArchivedFile(selectedItem);
            archivedFileItems = await loadFileList('archived');
            selectedItem = undefined;
        }
    }
</script>

<div class="container">
    {#if selectedItem}
        <button class="delete-btn" on:click={deleteSelectedEntry}>Delete</button
        >
        <pre class="archived-source">{selectedItem.content}</pre>
    {:else if archivedFileItems.length > 0}
        {#each archivedFileItems as file}
            <FileCardItem {onSelect} {file} />
        {/each}
    {:else}
        No archived items.
    {/if}
</div>

<style>
    .container {
        width: 100%;
        padding-right: 9px;
    }

    .archived-source {
        margin: 9px;
        border: #646cff 3px solid;
        width: 100%;
    }
</style>

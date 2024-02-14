<script lang="ts">
    import { onMount } from 'svelte';
    import {
        deleteArchivedFile,
        loadFileList,
    } from '../repository/NodeRepository';
    import type { FileItem } from '../file_item/FileItem';
    import FileCardItem from '../card/FileCardItem.svelte';

    export let fileItems: FileItem[] = [];
    let selectedItem: FileItem | undefined = undefined;

    onMount(async () => {
        fileItems = await loadFileList('archived');
    });

    function onSelect(fileItem: FileItem) {
        selectedItem = fileItem;
    }

    async function deleteSelectedEntry() {
        if (selectedItem) {
            await deleteArchivedFile(selectedItem);
            fileItems = await loadFileList('archived');
            selectedItem = undefined;
        }
    }
</script>

<div class="container">
    {#if selectedItem}
        <button class="delete-btn" on:click={deleteSelectedEntry}>Delete</button
        >
        <pre class="archived-source">{selectedItem.content}</pre>
    {:else if fileItems.length > 0}
        {#each fileItems as file}
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

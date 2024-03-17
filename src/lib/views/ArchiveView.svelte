<script lang="ts">
    import type { FileItem } from '../file_item/FileItem';
    import FileCardItem from '../card/FileCardItem.svelte';
    import { loadFileList } from '../repository/NodeRepository';
    import { onMount } from 'svelte';

    export let onSelectItem: (fileItem: FileItem | undefined) => void;
    export let archiveOrDeleteEntry: (
        fileItem: FileItem,
    ) => Promise<FileItem | undefined>;
    export let unarchiveEntry: (fileItem: FileItem) => void;
    export let selectedItem: FileItem | undefined = undefined;

    let archivedFileItems: FileItem[] = [];

    onMount(async () => {
        const archived = await loadFileList('archived');
        archived.sort((a, b) => b.mtime - a.mtime); // sort it.
        archivedFileItems = archived;
    });

    function unselectEntry() {
        onSelectItem(undefined);
    }

    async function deleteSelectedEntry() {
        if (selectedItem) {
            onSelectItem(await archiveOrDeleteEntry(selectedItem));
        }
    }

    async function unarchiveSelectedEntry() {
        if (selectedItem) {
            await unarchiveEntry(selectedItem);
            onSelectItem(undefined);
        }
    }
</script>

<div class="container">
    {#if selectedItem}
        <button on:click={unselectEntry}>Back to list</button>
        <button class="delete-btn" on:click={deleteSelectedEntry}>Delete</button
        >
        <button class="delete-btn" on:click={unarchiveSelectedEntry}
            >Unarchive</button
        >
        <pre class="archived-source">{selectedItem.content}</pre>
    {:else if archivedFileItems.length > 0}
        {#each archivedFileItems as file (file.filename)}
            <FileCardItem {onSelectItem} {file} />
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

    button {
        margin: 9px;
        height: 30px;
    }
</style>

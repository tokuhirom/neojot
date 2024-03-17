<script lang="ts">
    import type { FileItem } from '../file_item/FileItem';
    import FileCardItem from '../card/FileCardItem.svelte';
    import { loadFileList } from '../repository/NodeRepository';
    import { onMount } from 'svelte';
    import { selectedItemStore } from '../../Stores';

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
        $selectedItemStore = undefined;
    }

    async function deleteSelectedEntry() {
        if ($selectedItemStore) {
            $selectedItemStore = await archiveOrDeleteEntry($selectedItemStore);
        }
    }

    async function unarchiveSelectedEntry() {
        if ($selectedItemStore) {
            await unarchiveEntry($selectedItemStore);
            $selectedItemStore = undefined;
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
            <FileCardItem {file} />
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

<script lang="ts">
    import type { FileItem } from '../file_item/FileItem';
    import FileCardItem from '../card/FileCardItem.svelte';

    export let onSelectItem: (fileItem: FileItem | undefined) => void;
    export let archiveOrDeleteEntry: (
        fileItem: FileItem,
    ) => Promise<FileItem | undefined>;
    export let unarchiveEntry: (fileItem: FileItem) => void;
    export let selectedItem: FileItem | undefined = undefined;
    export let archivedFileItems: FileItem[] = [];

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
        <button class="delete-btn" on:click={deleteSelectedEntry}>Delete</button
        >
        <button class="delete-btn" on:click={unarchiveSelectedEntry}
            >Unarchive</button
        >
        <pre class="archived-source">{selectedItem.content}</pre>
    {:else if archivedFileItems.length > 0}
        {#each archivedFileItems as file}
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
</style>

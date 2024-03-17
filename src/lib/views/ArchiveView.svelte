<script lang="ts">
    import type { FileItem } from '../file_item/FileItem';
    import {
        deleteArchivedFile,
        loadFileList,
        unarchiveFile,
    } from '../repository/NodeRepository';
    import { onMount } from 'svelte';
    import { dataFileItemsStore } from '../../Stores';
    import CardItem from '../card/CardItem.svelte';

    let selectedItem: FileItem | undefined = undefined;

    let archivedFileItems: FileItem[] = [];

    onMount(async () => {
        const archived = await loadFileList('archived');
        archived.sort((a, b) => b.mtime - a.mtime); // sort it.
        archivedFileItems = archived;
    });

    function unselectEntry() {
        selectedItem = undefined;
    }

    async function deleteSelectedEntry() {
        if (selectedItem) {
            const fileItem = selectedItem;
            if (fileItem.filename.startsWith('archived/')) {
                console.log(`Deleting: ${fileItem.filename}`);
                await deleteArchivedFile(fileItem);
                archivedFileItems = archivedFileItems.filter(
                    (item) => item.filename !== fileItem.filename,
                );
                selectedItem = undefined;
            } else {
                throw new Error("It's not archived");
            }
        }
    }

    async function unarchiveSelectedEntry() {
        if (selectedItem) {
            const fileItem = selectedItem;
            if (fileItem.filename.startsWith('archived/')) {
                console.log(`Unarchive: ${fileItem.filename}`);
                await unarchiveFile(fileItem);
                $dataFileItemsStore = [fileItem, ...$dataFileItemsStore];
                $dataFileItemsStore = await loadFileList('data');
                archivedFileItems = archivedFileItems.filter(
                    (item) => item.filename !== fileItem.filename,
                );
            } else {
                throw new Error("It's not archived");
            }
            selectedItem = undefined;
        }
    }

    function onClick(fileItem: FileItem) {
        selectedItem = fileItem;
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
            <CardItem
                onClick={() => onClick(file)}
                title={file.title}
                content={file.content}
                imgSrc={undefined}
            />
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

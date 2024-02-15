<script lang="ts">
    import type { FileItem } from '../file_item/FileItem';
    import EntryView from '../markdown/EntryView.svelte';
    import LinkCards from '../link/LinkCards.svelte';
    import FileCardItem from '../card/FileCardItem.svelte';

    export let allFileItems: FileItem[] = [];
    export let dataFileItems: FileItem[] = [];
    export let selectedItem: FileItem | undefined = undefined;
    export let onSelectItem: (fileItem: FileItem | undefined) => void;
</script>

<div class="container">
    {#if selectedItem}
        <button class="back-to-list" on:click={() => onSelectItem(undefined)}>
            Back to List
        </button>

        <EntryView file={selectedItem} {allFileItems} {onSelectItem} />
        <LinkCards file={selectedItem} {allFileItems} {onSelectItem} />
    {:else}
        {#each dataFileItems as file}
            <FileCardItem {onSelectItem} {file} />
        {/each}
    {/if}
</div>

<style>
    .container {
        width: 100%;
    }

    .back-to-list {
        background-color: darkslategrey;
        color: white;
        padding: 9px;
        font-weight: bold;
        margin-top: 9px;
        margin-bottom: 20px;
    }
</style>

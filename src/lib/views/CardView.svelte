<script lang="ts">
    import { type FileItem, shouldShowFileItem } from '../file_item/FileItem';
    import EntryView from '../markdown/EntryView.svelte';
    import LinkCards from '../link/LinkCards.svelte';
    import FileCardItem from '../card/FileCardItem.svelte';
    import ClearableSearchBox from '../search/ClearableSearchBox.svelte';
    import ExcalidrawView from '../excalidraw/ExcalidrawView.svelte';
    import { makeMigemoRegexes } from '../search/Migemo';
    import { searchKeywordStore, selectedItemStore } from '../../Stores';

    export let dataFileItems: FileItem[] = [];
    export let pageTitles: string[];
    export let findEntryByTitle: (title: string) => FileItem | undefined;
    export let autoLinks: string[];

    let selectedItem: FileItem | undefined = undefined;
    selectedItemStore.subscribe((value) => {
        selectedItem = value;
    });

    let filteredFileItems: FileItem[];

    let migemoRegexes: RegExp[] = [];
    $: {
        makeMigemoRegexes($searchKeywordStore).then((r) => {
            migemoRegexes = r;
        });
    }

    $: if (dataFileItems || migemoRegexes) {
        filteredFileItems = dataFileItems.filter((it) =>
            shouldShowFileItem(it, $searchKeywordStore, migemoRegexes),
        );
    }

    function onSaved() {
        selectedItem = selectedItem;
    }
</script>

<div class="container">
    <ClearableSearchBox />
    {#if selectedItem}
        <button
            class="back-to-list"
            on:click={() => selectedItemStore.set(undefined)}
        >
            Back to List
        </button>

        {#if selectedItem.filename.endsWith('.excalidraw')}
            <div class="excalidraw-container">
                <ExcalidrawView {selectedItem} />
            </div>
        {:else}
            <EntryView
                file={selectedItem}
                {onSaved}
                {pageTitles}
                search={undefined}
                {findEntryByTitle}
                {autoLinks}
            />
            <LinkCards file={selectedItem} />
        {/if}
    {:else}
        {#each filteredFileItems as file (file.filename)}
            <FileCardItem {file} />
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

    .excalidraw-container {
        width: 100%;
        height: 80vh;
    }
</style>

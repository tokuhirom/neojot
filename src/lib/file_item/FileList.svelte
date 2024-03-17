<script lang="ts">
    import FileListItem from './FileListItem.svelte';
    import { makeMigemoRegexes } from '../search/Migemo';
    import { searchFileItems, type SearchResult } from './Search';
    import { dataFileItemsStore, searchKeywordStore } from '../../Stores';

    export let viewerMode: boolean = false;
    export let enterViewerMode: () => void = () => {};

    let searchResult: SearchResult[];

    let migemoRegexes: RegExp[] = [];
    searchKeywordStore.subscribe(async (value) => {
        makeMigemoRegexes(value)
            .then((r) => {
                migemoRegexes = r;
            })
            .catch((e) => {
                console.error('Cannot update migemo regexes', e);
            });
    });

    $: if (migemoRegexes) {
        searchResult = searchFileItems(
            $dataFileItemsStore,
            $searchKeywordStore,
            migemoRegexes,
        );
    }
</script>

<div>
    {#if searchResult}
        {#each searchResult as result (result.fileItem.filename)}
            <FileListItem
                fileItem={result.fileItem}
                matchLines={result.lines}
                {migemoRegexes}
                {enterViewerMode}
                {viewerMode}
            />
        {/each}
    {/if}
</div>

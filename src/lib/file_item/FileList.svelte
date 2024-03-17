<script lang="ts">
    import FileListItem from './FileListItem.svelte';
    import { type SearchResult } from './Search';
    import { searchFilteredFileItems } from '../../Stores';

    export let viewerMode: boolean = false;
    export let enterViewerMode: () => void = () => {};

    let searchResult: SearchResult[];
    searchFilteredFileItems.subscribe((value) => {
        searchResult = value;
    });
</script>

<div>
    {#if searchResult}
        {#each searchResult as result (result.fileItem.filename)}
            <FileListItem
                fileItem={result.fileItem}
                matchLines={result.lines}
                {enterViewerMode}
                {viewerMode}
            />
        {/each}
    {/if}
</div>

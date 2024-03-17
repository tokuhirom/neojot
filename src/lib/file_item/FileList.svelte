<script lang="ts">
    import FileListItem from './FileListItem.svelte';
    import { type FileItem } from './FileItem';
    import { makeMigemoRegexes } from '../search/Migemo';
    import { searchFileItems, type SearchResult } from './Search';
    import { searchKeywordStore } from '../../Stores';

    export let onSelectItem: (fileItem: FileItem | undefined) => void;
    export let dataFileItems: FileItem[] = [];
    export let selectedItem: FileItem | undefined = undefined;
    export let viewerMode: boolean = false;
    export let enterViewerMode: () => void = () => {};

    let searchResult: SearchResult[];

    $: if (dataFileItems || migemoRegexes) {
        searchResult = searchFileItems(
            dataFileItems,
            $searchKeywordStore,
            migemoRegexes,
        );
    }

    let migemoRegexes: RegExp[] = [];
    $: makeMigemoRegexes($searchKeywordStore)
        .then((r) => {
            migemoRegexes = r;
        })
        .catch((e) => {
            console.error('Cannot update migemo regexes', e);
        });
</script>

<div>
    {#if searchResult && selectedItem}
        {#each searchResult as result (result.fileItem.filename)}
            <FileListItem
                {onSelectItem}
                fileItem={result.fileItem}
                matchLines={result.lines}
                {migemoRegexes}
                {selectedItem}
                {enterViewerMode}
                {viewerMode}
            />
        {/each}
    {/if}
</div>

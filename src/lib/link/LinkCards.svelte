<script lang="ts">
    import { type FileItem } from '../file_item/FileItem';
    import FileCardItem from '../card/FileCardItem.svelte';
    import { buildLinks, type Links } from './Links';
    import CardItem from '../card/CardItem.svelte';
    import { createNewFileWithContent } from '../repository/NodeRepository';

    export let file: FileItem;
    export let allFileItems: FileItem[];
    export let onSelectItem: (fileItem: FileItem) => void;
    export let onCreateItem: (fileItem: FileItem) => void;

    let links: Links | undefined = undefined;

    $: if (allFileItems || file) {
        links = buildLinks(file, allFileItems);
    }

    async function createNewEntry(title: string) {
        const fileItem = await createNewFileWithContent(`# ${title}\n\n`);
        onCreateItem(fileItem);
    }
</script>

<div>
    {#if links}
        <div class="row">
            {#each links.links as file}
                <FileCardItem {onSelectItem} {file} />
            {/each}
        </div>
        {#each links.twoHopLinks as twoHopLink}
            <div class="row">
                <FileCardItem
                    {onSelectItem}
                    file={twoHopLink.src}
                    backgroundColor="yellowgreen"
                />
                {#each twoHopLink.dst as dst}
                    <FileCardItem {onSelectItem} file={dst} />
                {/each}
            </div>
        {/each}
        {#if links.newLinks.length > 0}
            <div class="row">
                <CardItem
                    title="New Link"
                    content=""
                    backgroundColor="darkgoldenrod"
                    onClick={() => false}
                />
                {#each links.newLinks as title}
                    <CardItem
                        {title}
                        content=""
                        color="gray"
                        onClick={() => createNewEntry(title)}
                    />
                {/each}
            </div>
        {/if}
    {/if}
</div>

<style>
    .row {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-start;
        align-items: flex-start;
        gap: 18px;
    }
</style>

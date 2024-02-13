<script lang="ts">
    import { type FileItem } from './FileItem';
    import FileCardItem from './FileCardItem.svelte';
    import { buildLinks, type Links } from './Links';
    import CardItem from './CardItem.svelte';
    import { createNewFileWithContent } from './repository/NodeRepository';

    export let file: FileItem;
    export let fileItems: FileItem[];
    export let openEntry: (fileItem: FileItem) => void;

    let links: Links | undefined = undefined;

    $: if (fileItems || file) {
        links = buildLinks(file, fileItems);
    }

    async function createNewEntry(title: string) {
        const fileItem = await createNewFileWithContent(`# ${title}\n\n`);
        fileItems.unshift(fileItem);
        openEntry(fileItem);
    }
</script>

<div>
    {#if links}
        <div class="row">
            {#each links.links as file}
                <FileCardItem onSelect={openEntry} {file} />
            {/each}
        </div>
        {#each links.twoHopLinks as twoHopLink}
            <div class="row">
                <FileCardItem
                    onSelect={openEntry}
                    file={twoHopLink.src}
                    backgroundColor="yellowgreen"
                />
                {#each twoHopLink.dst as dst}
                    <FileCardItem onSelect={openEntry} file={dst} />
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

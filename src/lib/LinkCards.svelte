<script lang="ts">
    import {extractBrackets, type FileItem} from "./FileItem";
    import CardItem from "./CardItem.svelte";

    export let file: FileItem;
    export let fileItems: FileItem[];
    export let openEntry: (fileItem: FileItem) => void;

    let forwardLinks: Record<string, FileItem[]> = {};

    $: if (fileItems) {
        for (let fileItem of fileItems) {
            const links = extractBrackets(fileItem.content);
            for (let link of links) {
                if (forwardLinks[link]) {
                    const exists = forwardLinks[link].some(item => item.filename === fileItem.filename);
                    if (!exists) {
                        forwardLinks[link].push(fileItem);
                    }
                } else {
                    forwardLinks[link] = [fileItem];
                }
            }
        }
    }

</script>

<div>
    {#if forwardLinks[file.title]}
        {#each forwardLinks[file.title] as file}
            <CardItem onSelect={openEntry} file={file} />
        {/each}
    {/if}
</div>

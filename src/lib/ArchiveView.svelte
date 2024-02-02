<script lang="ts">
    import {onMount} from "svelte";
    import {loadFileList} from "./repository/NodeRepository";
    import type {FileItem} from "./FileItem";
    import CardItem from "./CardItem.svelte";

    export let fileItems: FileItem[] = [];

    onMount(async () => {
        fileItems = await loadFileList("archived", true);
    });

    function onSelect(fileItem: FileItem) {
        console.log(fileItem);
    }
</script>

<div>
    archived
    {#each fileItems as file}
        <CardItem onSelect={onSelect} file={file} />
    {/each}
</div>

<script lang="ts">
    import type {FileEntry} from "@tauri-apps/api/fs";

    export let openEntry: (fileEntry: FileEntry) => void;
    export let entry: FileEntry;

    function handleOnClick() {
        openEntry(entry);
    }
</script>

<div>
    <button on:click={handleOnClick}>{entry.name}</button>
</div>

<style>
    button {
        width: 100%;
    }
</style>
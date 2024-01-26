<script lang="ts">
    import type {FileEntry} from "@tauri-apps/api/fs";

    export let openEntry: (fileEntry: FileEntry) => void;
    export let entry: FileEntry;
    export let selectedEntry: FileEntry;

    function handleOnClick() {
        openEntry(entry);
    }
</script>

<div>
    <button on:click={handleOnClick}
          class:active={selectedEntry.name === entry.name}
    >{entry.name}</button>
</div>

<style>
    button {
        width: 100%;

        background: none;
        color: inherit;
        border: none;
        padding: 8px;
        margin: 0;
        font: inherit;
        cursor: pointer;
        border-bottom: darkslategrey 1px solid;
    }

    button.active {
        background-color: midnightblue;
    }
</style>
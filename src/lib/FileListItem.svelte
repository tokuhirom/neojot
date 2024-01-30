<script lang="ts">
    import type {FileItem} from "./FileItem";

    export let openEntry: (fileItem: FileItem) => void;
    export let fileItem: FileItem;
    export let selectedItem: FileItem;

    function handleOnClick() {
        openEntry(fileItem);
    }

    function formatEpochSeconds() {
        const epochSeconds = fileItem.mtime;
        const date = new Date(epochSeconds * 1000); // エポックミリ秒に変換
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 月は0から始まるため、1を足す
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
</script>

<div>
    <button
            on:click={handleOnClick}
          class:active={selectedItem.name === fileItem.name}
    >{fileItem.name}
        <span class="mtime">{formatEpochSeconds()}</span>
    </button>
</div>

<style>
    .mtime {
        display: block;
    }

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

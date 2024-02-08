<script lang="ts">
    import type {FileItem} from "./FileItem";
    import CardItem from "./CardItem.svelte";

    export let file: FileItem;
    export let onSelect: (fileItem: FileItem) => void;
    export let backgroundColor = "#f6f6f6";
    export let color = "#0f0f0f";

    function onClick() {
        onSelect(file);
    }
</script>

<CardItem onClick={onClick}
          backgroundColor={backgroundColor}
          color={color}
          title={file.title.replace(/TODO: /, "☐️").replace(/DONE: /, "☑")}
          content={file.content.split('\n').slice(1).join('\n')}
/>

<style>
    .card {
        display: flex; /* Flexboxを有効にします */
        flex-direction: column; /* アイテムを縦方向に並べます */
        align-items: flex-start; /* 左寄せにします（テキストが左揃えの場合） */
        justify-content: flex-start; /* アイテムを上に寄せます */
        float: left;
        width: 100px;
        margin: 9px;
        background-color: #f6f6f6;
        color: #0f0f0f;
        padding: 9px;
        height: 120px;
        overflow-y: hidden;;
        border-radius: 2px;
        text-align: left;
        vertical-align: top;
    }

    .title {
        font-size: 15px;
        font-weight: bold;
        word-break: break-all;
    }

    .content {
        font-size: 10px;
    }
</style>

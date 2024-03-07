<script lang="ts">
    export let title: string;
    export let content: string;
    export let onClick: () => void;
    export let backgroundColor = '#f6f6f6';
    export let color = '#0f0f0f';

    export let imgSrc: string | undefined;
</script>

<button
    class="card"
    style:background-color={backgroundColor}
    style:color
    on:click|preventDefault={onClick}
>
    {#if imgSrc}
        <img
            src={imgSrc}
            alt="excalidraw image"
            style="max-width: 100%;max-height: 100%; border: 1px solid #000;"
        />
    {:else}
        <span class="title">{title}</span>
        <span class="content">{content}</span>
    {/if}
</button>

<style>
    .card {
        display: flex; /* Flexboxを有効にします */
        flex-direction: column; /* アイテムを縦方向に並べます */
        align-items: flex-start; /* 左寄せにします（テキストが左揃えの場合） */
        justify-content: flex-start; /* アイテムを上に寄せます */
        float: left;
        width: 100px;
        margin: 9px;
        padding: 9px;
        height: 120px;
        overflow-y: hidden;
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

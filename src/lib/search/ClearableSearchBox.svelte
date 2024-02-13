<script>
    export let searchWord = ''; // 検索ボックスのテキストを保持する変数
</script>

<div class="clearable-search-box">
    <input type="text" bind:value={searchWord} class="search-input" />
    {#if searchWord}
        <button class="clear-btn" on:click={() => (searchWord = '')}>✗</button>
    {/if}
</div>

<style>
    .clearable-search-box {
        position: relative;
        display: inline-block;
        width: 100%;
        margin-top: 9px;
        margin-bottom: 9px;
    }
    .search-input {
        font-size: 140%;
        width: 100%;
    }
    .clear-btn {
        position: absolute;
        right: 5px;
        top: 50%;
        transform: translateY(-50%);
        border: none;
        background-color: transparent;
        cursor: pointer;
    }
</style>

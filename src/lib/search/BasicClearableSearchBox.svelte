<script lang="ts">
    export let keyword: string;

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            keyword = '';
        }
    }
</script>

<div class="clearable-search-box">
    <input
        type="text"
        bind:value={keyword}
        class="search-input"
        on:keydown={handleKeydown}
    />
    {#if keyword}
        <button class="clear-btn" on:click={() => (keyword = '')}>✗</button>
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

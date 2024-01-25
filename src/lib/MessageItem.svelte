<script lang="ts">
    import type {Message} from "./Message";
    import InputBox from "./InputBox.svelte";
    import {writeText} from "@tauri-apps/api/clipboard";

    export let message: Message;

    let showReply = false;

    function convertEpochToDateTime(epochSeconds: number) {
        const date = new Date(epochSeconds * 1000); // Convert epoch seconds to milliseconds
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2); // Months are zero-based
        const day = ('0' + date.getDate()).slice(-2);
        const hour = ('0' + date.getHours()).slice(-2);
        const minutes = ('0' + date.getMinutes()).slice(-2);

        return `${year}-${month}-${day} ${hour}:${minutes}`;
    }

    async function copy() {
        await writeText(message.body);
    }

    function toggleReply() {
        showReply = !showReply;
    }
</script>

<div>
    <div class="message">
        <div class="header">
            <div class="time">{convertEpochToDateTime(message.createdSeconds)}</div>
            {#if message.replyTo}
                <button class="reply-to">>{message.replyTo}</button>
            {/if}
            <div class="ops">
                <button on:click|preventDefault={toggleReply}>Reply</button>
                <button on:click={copy}>Copy</button>
            </div>
        </div>
        <div>{message.body}</div>
        {#if showReply}
            <div class="reply-container">
                <InputBox replyTo={message.id} />
            </div>
        {/if}
    </div>
</div>

<style>
    .message {
        border-top: #535bf2 1px solid;
        padding-top: 8px;
        margin-bottom: 9px;
    }

    .header {
        display: flex; /* Enables Flexbox */
        justify-content: space-between; /* Aligns children with space between them */
        align-items: center; /* Aligns children vertically in the center */
    }

    .header .reply-to {
        background: none; /* Removes background */
        border: none; /* Removes border */
        color: #646cff; /* Sets text color to blue */
        font: inherit; /* Inherits font from parent */
        cursor: pointer; /* Changes cursor to pointer on hover */
        padding: 0; /* Removes padding */
        margin: 0; /* Removes margin */
    }

    .ops > button {
        background: none; /* Removes background */
        border: none; /* Removes border */
        color: #646cff; /* Sets text color to blue */
        font: inherit; /* Inherits font from parent */
        cursor: pointer; /* Changes cursor to pointer on hover */
        padding: 0; /* Removes padding */
        margin: 0; /* Removes margin */
    }

    .reply-container {
        margin-left: 30px;
    }
</style>

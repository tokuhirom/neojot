<script lang="ts">
    import type {Message} from "./Message";
    import InputBox from "./InputBox.svelte";
    import MessageItem from "./MessageItem.svelte";
    import {writeText} from "@tauri-apps/api/clipboard";
    import {MessageRepository} from "./repository/MessageRepository";
    import {onMount} from "svelte";

    export let message: Message;
    export let messageRepository: MessageRepository;
    let showReply = false;

    onMount(() => {
        if (message.replies.length > 0) {
            showReply = true;
        }
    });

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
            <div class="ops">
                <button on:click|preventDefault={toggleReply}>Reply
                    {#if message.replies.length > 0}
                        ({message.replies.length})
                    {/if}
                </button>
                <button on:click={copy}>Copy</button>
            </div>
        </div>
        <div>{message.body}</div>
        {#if showReply}
            <div class="reply-container">
                {#each message.replies as reply}
                    <MessageItem message={reply} messageRepository={messageRepository} />
                {/each}
                <InputBox replyTo={message} messageRepository={messageRepository} />
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

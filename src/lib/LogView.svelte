<script lang="ts">
    import type {Message} from "./Message";
    import {listen} from "@tauri-apps/api/event";
    import {onDestroy, onMount} from "svelte";
    import {MessageRepository} from "./repository/MessageRepository";
    import {writeText} from "@tauri-apps/api/clipboard";

    function uuidv4() {
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c: string) =>
            (parseInt(c, 10) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> parseInt(c, 10) / 4).toString(16)
        );
    }

    let messages: Message[] = [];
    const messageRepository = new MessageRepository();

    onMount(async () => {
        messages = await messageRepository.load();
    })

    let unlisten = listen("send_message", (event) => {
        let payload = event.payload as {body: string};
        let body = payload.body;
        console.log(body)
        let createdSeconds = Math.floor(new Date().getTime() / 1000);
        messages.push({
            id: uuidv4(),
            createdSeconds:createdSeconds,
            body: body,
        });
        messageRepository.save(messages);
        messages = messages;
    });
    onDestroy(async () => {
        if (unlisten) {
            (await unlisten)();
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

    async function copy(message: Message) {
        await writeText(message.body);
    }
</script>

<div>
    {#each messages.reverse() as message}
        <div class="message">
            <div class="header">
                <div class="time">{convertEpochToDateTime(message.createdSeconds)}</div>
                <div class="ops"><button on:click={() => copy(message)}>Copy</button></div>
            </div>
            <div>{message.body}</div>
        </div>
    {/each}
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
</style>

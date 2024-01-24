<script lang="ts">
    import type {Message} from "./Message";

    const messages: Message[] = [ // mock
        {
            "createdSeconds": 1706073531,
            "body": "hello",
        }
    ];

    function convertEpochToDateTime(epochSeconds: number) {
        const date = new Date(epochSeconds * 1000); // Convert epoch seconds to milliseconds
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2); // Months are zero-based
        const day = ('0' + date.getDate()).slice(-2);
        const hour = ('0' + date.getHours()).slice(-2);
        const minutes = ('0' + date.getMinutes()).slice(-2);

        return `${year}-${month}-${day} ${hour}:${minutes}`;
    }

    function copy(message: Message) {
        alert("Copy to clipboard");
    }
</script>

<div>
    {#each messages as message}
        <div class="header">
            <div class="time">{convertEpochToDateTime(message.createdSeconds)}</div>
            <div class="ops"><button on:click={() => copy(message)}>Copy</button></div>
        </div>
        <div>{message.body}</div>
    {/each}
</div>

<style>
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

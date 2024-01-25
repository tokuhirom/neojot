<script lang="ts">
    import type {Message} from "./Message";
    import {listen} from "@tauri-apps/api/event";
    import {onDestroy, onMount} from "svelte";
    import {MessageRepository} from "./repository/MessageRepository";
    import MessageItem from "./MessageItem.svelte";

    let messages: Message[] = [];
    export let messageRepository: MessageRepository;

    onMount(async () => {
        await messageRepository.load();
        messages = messageRepository.messages;
    })

    let unlisten = listen("sent_message", async () => {
        messages = messageRepository.messages;
    });
    onDestroy(async () => {
        if (unlisten) {
            (await unlisten)();
        }
    });

</script>

<div>
    {#each messages as message}
        <MessageItem message={message} messageRepository={messageRepository} />
    {/each}
</div>

<style>
</style>

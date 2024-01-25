<script lang="ts">
    import type {Message} from "./Message";
    import {listen} from "@tauri-apps/api/event";
    import {onDestroy, onMount} from "svelte";
    import {MessageRepository} from "./repository/MessageRepository";
    import {writeText} from "@tauri-apps/api/clipboard";
    import InputBox from "./InputBox.svelte";
    import MessageItem from "./MessageItem.svelte";

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
        let payload = event.payload as {
            body: string,
            replyTo: string | null
        };
        let body = payload.body;
        console.log(body)
        let createdSeconds = Math.floor(new Date().getTime() / 1000);
        messages.push({
            id: uuidv4(),
            replyTo: payload.replyTo,
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

</script>

<div>
    {#each messages.reverse() as message}
        <MessageItem message={message} />
    {/each}
</div>

<style>
</style>

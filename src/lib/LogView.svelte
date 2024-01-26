<script lang="ts">
    import type {OutlineNode} from "./OutlineNode";
    import {onMount} from "svelte";
    import {NodeRepository} from "./repository/NodeRepository";
    import MessageItem from "./MessageItem.svelte";

    let messages: OutlineNode[] = [];
    export let messageRepository: NodeRepository;

    onMount(async () => {
        await messageRepository.load();
        // messages = messageRepository.messages;
    })

    // let unlisten = listen("sent_message", async () => {
    //     messages = messageRepository.messages;
    // });
    // onDestroy(async () => {
    //     if (unlisten) {
    //         (await unlisten)();
    //     }
    // });

</script>

<div>
    {#each messages as message}
        <MessageItem parent={null} message={message} messageRepository={messageRepository} />
    {/each}
</div>

<style>
</style>

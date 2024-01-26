<script lang="ts">

    import {emit} from "@tauri-apps/api/event";
    import type {NodeRepository} from "./repository/NodeRepository";
    import type {OutlineNode} from "./OutlineNode";

    export let replyTo: OutlineNode | null;
    export let messageRepository: NodeRepository;

    let body="";
    let inserted = true;

    async function send() {
        if (body.length > 0 && body.match(/\S/)) {
            if (replyTo) {
                await messageRepository.reply(replyTo, body);
            } else {
                await messageRepository.post(body);
            }
            await emit("sent_message");
        }
        body = "";
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
            return;
        }
        if (inserted) {
            inserted = false; // ignore the insertFromComposition event.
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();

            send();
        }
    }

    function handleInput(event: InputEvent) {
        if (event.inputType === "insertFromComposition") {
            inserted = true;
        }
    }
</script>

<div>
    <form on:submit|preventDefault={send}>
        <textarea bind:value={body} cols="40" rows="3" on:keyup={handleKeydown}
                  on:input={handleInput}
        ></textarea>
        <button type="submit">Send</button>
    </form>
</div>

<style>
    form {
        display: flex;
        flex-direction: row;
        align-items: stretch;
    }

    textarea {
        font-size: 1em;
        width: 90%;
        resize: vertical;
    }

    button {
        width: 10%;
    }
</style>

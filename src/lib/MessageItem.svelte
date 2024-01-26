<script lang="ts">
    import {createOutlineNode, type OutlineNode} from "./OutlineNode";
    import MessageItem from "./MessageItem.svelte";
    import {emit} from "@tauri-apps/api/event";

    export let parent: OutlineNode;
    export let node: OutlineNode;

    export function handleKeyPress(event: KeyboardEvent) {
        if ((event.key === "h" && event.ctrlKey) || event.key === "Backspace") {
            if (node.body === "" || node.body === "<br>") {
                // delete node.
                console.log(`Delete node: ${node.body} (parent=${parent.children.length}`);
                parent.children = parent.children.filter((it) => {
                   console.log(it, node);
                   return it.id !== node.id;
                });
                console.log(`Deleted node: (parent=${parent.children.length}`);
            }
        }
        console.log(`keypress: ${event.key} ${event.keyCode}`)
    }

    async function handleUpdateMessageBody(event: InputEvent) {
        console.log(`UPDATED: ${node.body} ${event.inputType}`)

        if (event.inputType == "insertParagraph") {
            // When the user push the "Enter" key.
            event.preventDefault();
            event.stopPropagation();

            if (parent) {
                 console.log("insert new sibling node");
                 parent.children.push(createOutlineNode());
            } else {
                console.log("parent would be null");
            //     await messageRepository.post("");
            }
            await emit("sent_message");

            return;
        }
    }
</script>

<div>
    <div class="message">
        <div contenteditable
             on:input={handleUpdateMessageBody}
             on:keydown={handleKeyPress}
             bind:innerHTML={node.body}></div>
        <div class="reply-container">
            {#if node.children}
                {#each node.children as child}
                    <MessageItem parent={node} node={child} />
                {/each}
            {/if}
        </div>
    </div>
</div>

<style>
    .message {
        padding-top: 8px;
        margin-bottom: 9px;
        padding-right: 8px;
        border-bottom: darkgrey 1px solid;
    }
    .message:hover {
        border-left: yellowgreen 3px solid;
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

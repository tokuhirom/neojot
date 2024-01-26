<script lang="ts">
    import {
        createOutlineNode,
        insertNewNodeAfter,
        moveNodeDown,
        moveNodeUp,
        type OutlineNode,
        removeNode
    } from "./OutlineNode";
    import MessageItem from "./MessageItem.svelte";
    import {emit, listen} from "@tauri-apps/api/event";
    import {onDestroy, onMount} from "svelte";

    export let root: OutlineNode;
    export let parent: OutlineNode;
    export let node: OutlineNode;
    let children: OutlineNode[];

    let inserted = false;

    onMount(() => {
        children = node.children;
    });

    let unlisten = listen("render-nodes", () => {
        console.log("render-nodes");
        node = node;
        parent = parent;
        children = node.children;
    });
    onDestroy(async () => {
        if (unlisten) {
            (await unlisten)();
        }
    });

    function newFocus(target: OutlineNode | undefined) {
        if (target) {
            setTimeout(() => {
                let el = document.getElementById(target.id);
                if (el) {
                    el.focus();
                } else {
                    console.log("The element is not ready...");
                }
            }, 0);
        }
    }

    export async function handleKeyPress(event: KeyboardEvent) {
        if ((event.key === "h" && event.ctrlKey) || event.key === "Backspace") {
            if (node.body === "" || node.body === "<br>") {
                // delete node.
                // console.log(`Delete node: ${node.body} (parent=${parent.children.length}`);
                // console.log(node, parent);
                // parent.children = parent.children.filter((it) => {
                //    return it.id !== node.id;
                // });
                // console.log(`Deleted node: (parent=${parent.children.length}`);

                let newTarget = removeNode(parent, node);

                node = {...node};
                parent = {...parent};
                await emit("save");
                await emit("render-nodes");

                newFocus(newTarget); // TODO focus した上で、末尾にカーソル合わせたいかも。。
                return;
            }
        } else if (event.key === "Tab") {
            event.preventDefault();
            event.stopPropagation();
            if (event.shiftKey) {
                moveNodeUp(root, parent, node);
            } else {
                moveNodeDown(parent, node);
            }
            await emit("save");
            await emit("render-nodes");
            newFocus(node);
            return false;
        }

        if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
            return;
        }
        if (inserted) {
            inserted = false; // ignore the insertFromComposition event.
            return;
        }


        if (event.key == "Enter") {
            // enter key was already handled by handleInput.
            console.log("ENTER");
            event.preventDefault();

            // 現行ノードに対して、直後にノードを追加する
            let inserted = insertNewNodeAfter(parent, node);
            await emit("save");
            await emit("render-nodes");

            newFocus(inserted);

            return;
        }

        console.log(`keypress: ${event.key} ${event.keyCode}`)
    }

    async function handleInput(event: InputEvent) {
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
            await emit("save");

            return;
        }

        if (event.inputType === "insertFromComposition") {
            inserted = true;
            return;
        }
    }
</script>

<div>
    <div class="message">
        <div contenteditable
             on:input={handleInput}
             on:keydown={handleKeyPress}
             bind:innerHTML={node.body}
             id={node.id}></div>
        <div class="reply-container">
            {#if children}
                {#each children as child}
                    <MessageItem root={root} parent={node} node={child} />
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

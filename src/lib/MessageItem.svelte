<script lang="ts">
    import {
        createOutlineNode,
        insertNewNodeAfter,
        moveNodeDown,
        moveNodeUp,
        type OutlineNode,
        removeNode, stringifyNode
    } from "./OutlineNode";
    import MessageItem from "./MessageItem.svelte";
    import {emit, listen} from "@tauri-apps/api/event";
    import {onDestroy, onMount} from "svelte";

    export let root: OutlineNode;
    export let parent: OutlineNode;
    export let node: OutlineNode;

    let inserted = false;

    function newFocus(target: OutlineNode | undefined) {
        if (target) {
            setTimeout(() => {
                let el = document.getElementById(target.id);
                if (el) {
                    console.log(`newFocus: Select ${target.id}`)
                    el.focus();
                } else {
                    console.log(`The element is not ready...: ${target.id}`);
                }
            }, 1);
        }
    }

    export async function handleKeyPress(event: KeyboardEvent) {
        if ((event.key === "h" && event.ctrlKey) || event.key === "Backspace") {
            if (node.body === "" || node.body === "<br>") {
                let newTarget = removeNode(parent, node);

                await emit("save", true);

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
            await emit("save", true);
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
            event.preventDefault();

            // 現行ノードに対して、直後にノードを追加する
            console.log(`BEFORFE:ENTER, insertNewNodeAfter:: ${stringifyNode(root)}`);
            let inserted = insertNewNodeAfter(parent, node);
            console.log(`AFTER:ENTER, insertNewNodeAfter:: ${stringifyNode(root)}`);
            await emit("save", true);

            newFocus(inserted);

            return;
        }

        console.log(`keypress: ${event.key} ${event.keyCode}`)
    }

    async function handleInput(event: InputEvent) {
        console.log(`handleInput: ${node.body},${JSON.stringify(node)},${JSON.stringify(root)}  ${stringifyNode(root)} ${event.inputType}`)

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
            await emit("save", true);

            return;
        }


        if (event.inputType === "insertFromComposition") {
            inserted = true;
        }

        if (node.body.startsWith("TODO:")) {
            node.body = node.body.replace(/^TODO:/, "<span class='todo'>TODO:</span>");
        }
        await emit("save", false);
    }

    function focus(node: HTMLElement) {
        node.focus();
    }
</script>

<div>
    <div class="message">
        <div
            class="editable-with-bullet"
            contenteditable
             on:input={handleInput}
             on:keydown={handleKeyPress}
             bind:innerHTML={node.body}
             id={node.id}
            use:focus></div>
        <div class="children">
            {#if node.children}
                {#each node.children as child}
                    <MessageItem root={root} parent={node} node={child} />
                {/each}
            {/if}
        </div>
    </div>
</div>

<style>
    .message {
        /*padding-top: 8px;*/
        /*margin-bottom: 9px;*/
        padding-right: 8px;
        word-break: break-all;
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

    .children {
        margin-left: 20px;
    }


    [contenteditable]:focus {
        outline: none;
    }

    .editable-with-bullet {
        position: relative; /* 位置の基準点として設定 */
        padding-left: 20px; /* バレットとテキストの間にスペースを作る */
    }

    .editable-with-bullet:before {
        content: '•'; /* バレットの記号 */
        position: absolute; /* 絶対位置指定 */
        left: 0; /* 左端に配置 */
        top: 50%; /* 上下中央に配置 */
        transform: translateY(-50%); /* Y軸方向の中心を合わせる */
        color: wheat; /* バレットの色 */
        font-size: 20px; /* バレットのサイズ */
    }

</style>

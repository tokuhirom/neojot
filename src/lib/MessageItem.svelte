<script lang="ts">
    import {
        type Line, type Entry, removeLine, insertNewLineAfter
    } from "./Line";
    import MessageItem from "./MessageItem.svelte";
    import {emit} from "@tauri-apps/api/event";
    import {onMount} from "svelte";

    export let entry: Entry;
    export let line: Line;
    console.log("Initialize MessageItem")
    let content = line.body;

    onMount(() => {
       content = line.body;
    });

    let isFocused = false;

    function marked(src: string): string {
        return src.replace(/\*\*(.+?)\*\*/, "<B>$1</B>");
    }

    function handleFocus() {
        console.log(`handleFocus ${line.id}, body=${line.body}, content=${content}, entry=${JSON.stringify(entry)}`);
        isFocused = true;
        content = line.body;
    }

    function handleBlur() {
        isFocused = false;
        for (let i = 0; i < entry.lines.length; i++) {
            if (entry.lines[i].id == line.id) {
                console.log("Updating entry...")
                entry.lines[i].body = content;
            }
        }
        line.body = content;
        content = marked(line.body);
        console.log(`handleBlur body=${line.body}, content=${content}, entry=${JSON.stringify(entry)}`);
    }

    let inserted = false;

    function newFocus(target: Line | undefined) {
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
            if (content === "" || content === "<br>") {
                console.log("remove line");
                let newTarget: Line = removeLine(entry, line);

                await emit("save");

                newFocus(newTarget); // TODO focus した上で、末尾にカーソル合わせたいかも。。
                return;
            }
        } else if (event.key === "Tab") {
            event.preventDefault();
            event.stopPropagation();
            console.log("Adjusting indent");
            line.indent = Math.max(line.indent + (event.shiftKey ? -1 : 1), 0);
            await emit("save");
            // newFocus(line);
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
            console.log(`insertNewLineAfter: body=${line.body},entry=${JSON.stringify(entry)}`)

            // 現行行に対して、直後に行を追加する
            let inserted: Line = insertNewLineAfter(entry, line);
            await emit("save");

            newFocus(inserted);

            return;
        }

        console.log(`keypress: ${event.key}`)
    }

    async function handleInput(event: InputEvent) {
        console.log(`handleInput: body=${line.body},content=${content},entry=${JSON.stringify(entry)}  ${entry} ${event.inputType}`)
        // line.body = content;

        if (event.inputType == "insertParagraph") {
            // When the user push the "Enter" key.
            event.preventDefault();
            event.stopPropagation();

            if (parent) {
                 console.log("insert new sibling node");
                 let newLine = insertNewLineAfter(entry, line);
                 newFocus(newLine);
            } else {
                console.log("parent would be null");
            //     await messageRepository.post("");
            }
            await emit("save");

            return;
        }


        if (event.inputType === "insertFromComposition") {
            inserted = true;
        }

        await emit("save");
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
            on:focus={handleFocus}
            on:blur={handleBlur}
             on:input={handleInput}
             on:keydown={handleKeyPress}
             bind:innerHTML={content}
             id={line.id}
            style="margin-left: {8 * line.indent}px"
            use:focus></div>
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

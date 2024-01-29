<script lang="ts">

import {type Entry, insertNewLineAfter, type Line, removeLine} from "./Line";
import {NodeRepository} from "./repository/NodeRepository";

export let entry: Entry;
export let fileName: string;
export let nodeRepository: NodeRepository;

let inserted = false;

async function save() {
    console.log(`SAVING: ${fileName}, ${JSON.stringify(entry)}`);
    await nodeRepository.save(fileName, entry);
}

let isFocused: Record<string, boolean> = {};

function marked(src: string): string {
    return src.replace(/\*\*(.+?)\*\*/, "<B>$1</B>");
}

function handleFocus(e: Event, line: Line) {
    console.log(`handleFocus ${line.id}, body=${line.body}, entry=${JSON.stringify(entry)}`);
    isFocused[line.id] = true;
    newFocus(line);
}

function handleBlur(e: Event, line: Line) {
    isFocused[line.id] = false;
    return true;
}

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

export async function handleKeyDown(event: KeyboardEvent, line: Line) {
    console.log(`handleKeyDown: ${line}`)
    if ((event.key === "h" && event.ctrlKey) || event.key === "Backspace") {
        if (line.body === "" || line.body === "<br>") {
            console.log("remove line");
            let newTarget: Line = removeLine(entry, line);

            await save();

            entry = entry;
            newFocus(newTarget); // TODO focus した上で、末尾にカーソル合わせたいかも。。
            return;
        }
    } else if (event.key === "Tab") {
        event.preventDefault();
        event.stopPropagation();
        console.log("Adjusting indent");
        line.indent = Math.max(line.indent + (event.shiftKey ? -1 : 1), 0);
        await save();

        entry = entry;
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
        await save();

        entry = entry;

        newFocus(inserted);

        return;
    }

    console.log(`keypress: ${event.key}`)
}

async function handleInput(event: InputEvent, line: Line) {
    console.log(`handleInput: body=${line.body},entry=${JSON.stringify(entry)}  ${entry} ${event.inputType}`)
    // line.body = content;

    if (event.inputType == "insertParagraph") {
        // When the user push the "Enter" key.
        event.preventDefault();
        event.stopPropagation();

        console.log("insert new sibling node");
        let newLine = insertNewLineAfter(entry, line);
        newFocus(newLine);

        await save();

        return;
    }


    if (event.inputType === "insertFromComposition") {
        inserted = true;
    }

    await save();
}


function focus(node: HTMLElement) {
    node.focus();
}
</script>

<div>
    {#each entry.lines as line}
        {#if isFocused[line.id]}
            <div
                    class="editable-with-bullet message"
                    contenteditable
                    on:blur={(e) => handleBlur(e, line)}
                    on:input={(e) => handleInput(e, line)}
                    on:keydown={(e) => handleKeyDown(e, line)}
                    bind:innerHTML={line.body}
                    id={line.id}
                    style="margin-left: {8 * line.indent}px"
                    ></div>
        {:else}
            <div
                    class="editable-with-bullet message"
                    contenteditable
                    on:focus={(e) => handleFocus(e, line)}
                    on:keydown={(e) => handleKeyDown(e, line)}
                    id={line.id}
                    style="margin-left: {8 * line.indent}px"
                    >{@html marked(line.body)}</div>
        {/if}
    {/each}
</div>

<style>
    .message {
        /*padding-top: 8px;*/
        /*margin-bottom: 9px;*/
        padding-right: 8px;
        word-break: break-all;
        min-height: 1em;
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
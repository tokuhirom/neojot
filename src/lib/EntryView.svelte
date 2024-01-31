<script lang="ts">

import {NodeRepository} from "./repository/NodeRepository";
import {onMount} from "svelte";
import {defaultKeymap} from "@codemirror/commands";
import {markdown} from "@codemirror/lang-markdown";
import {EditorState, Transaction} from "@codemirror/state";
import {EditorView, keymap} from "@codemirror/view";
import {extractTitle, type FileItem} from "./FileItem";
import {emit} from "@tauri-apps/api/event";
import {oneDark, oneDarkHighlightStyle} from "@codemirror/theme-one-dark";
import {syntaxHighlighting} from "@codemirror/language";
import {autocompletion, type CompletionContext} from "@codemirror/autocomplete";

export let file: FileItem;
export let nodeRepository: NodeRepository;
export let fileItems: FileItem[];

let myElement;

async function save() {
    console.log(`SAVING: ${file.filename}`);
    let state = view.state;
    let doc = state.doc;
    let text = doc.toString();
    file.content = text;
    const newTitle = extractTitle(text);
    if (file.title !== newTitle) {
        file.title = newTitle;
        await emit("change_title", {filename: file.filename});
    }
    await nodeRepository.save(file.filename, text);
}

let view: EditorView;

onMount(() => {
    let container = myElement;

    const myCompletion = (context: CompletionContext) => {
        const word = context.matchBefore(/\[\[\w*/);
        // const word = context.matchBefore(/\[\[[^\]]*\]?$/);
        if (word) {
            console.log("Return links")
            const options = fileItems.map(fileItem => {
                return {label: `[[${fileItem.title}]]`, type: 'keyword'};
            });
            return {
                from: word.from,
                options: options,
            };
        }
        return null;
    };

    let startState = EditorState.create({
        doc: file.content,
        extensions: [
            keymap.of(defaultKeymap),
            markdown(),
            autocompletion({ override: [myCompletion] }),
            oneDark,
            syntaxHighlighting(oneDarkHighlightStyle),
            EditorView.lineWrapping,
            EditorView.updateListener.of(async update => {
                if (update.changes) {
                    let isUserInput = update.transactions.some(tr => tr.annotation(Transaction.userEvent) !== "program");
                    if (isUserInput) {
                        console.log(`テキストが変更されました ${isUserInput}`);
                        await save();
                    }
                }
            })
        ]
    })

    view = new EditorView({
        state: startState,
        parent: container
    })
});

let prevFileName = "";

$: if (file) {
    if (view) {
        if (prevFileName !== file.filename) {
            console.log(`Loading entry: ${file.filename}`)

            let state = view.state;
            let transaction = state.update({
                changes: {from: 0, to: state.doc.length, insert: file.content},
                annotations: Transaction.userEvent.of("program")
            });
            view.dispatch(transaction);

            prevFileName = file.filename;
        }
    }
}


</script>

<div bind:this={myElement}>
</div>

<style>
</style>

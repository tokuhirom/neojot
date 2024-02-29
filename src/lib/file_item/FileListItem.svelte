<script lang="ts">
    import type { FileItem, MatchedLine } from './FileItem';
    import { emit, listen } from '@tauri-apps/api/event';
    import { onDestroy } from 'svelte';

    export let onSelectItem: (fileItem: FileItem) => void;
    export let fileItem: FileItem;
    export let matchLines: MatchedLine[] | undefined;
    export let searchWord: string | undefined;
    export let selectedItem: FileItem;

    let searchWords: string[] | undefined = undefined;

    $: if (searchWord) {
        searchWords =
            searchWord.length > 0 ? searchWord.split(/\s+/) : undefined;
    }

    const unlisten = listen('change_title', (e) => {
        const payload = e.payload as { filename: string };
        if (payload.filename === fileItem.filename) {
            fileItem = fileItem;
        }
    });
    onDestroy(async () => {
        (await unlisten)();
    });

    function handleOnClick(e: Event) {
        const elem = e.target as HTMLElement;
        onSelectItem(fileItem);

        const lineNumber = elem.getAttribute('data-lineNumber');
        if (lineNumber && lineNumber.length) {
            emit('go-to-line-number', parseInt(lineNumber, 10));
        }
    }

    function formatEpochSeconds() {
        const epochSeconds = fileItem.mtime;
        const date = new Date(epochSeconds * 1000); // エポックミリ秒に変換
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 月は0から始まるため、1を足す
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }

    function highlightKeyword(line: string, keywords: string[]): string {
        // HTMLエンティティにエスケープする関数
        const escapeHtml = (text: string) =>
            text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');

        // 特殊文字をエスケープする関数
        const escapeRegExp = (text: string) =>
            text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

        // エスケープされたキーワード用の正規表現を構築
        const regex = new RegExp(
            keywords
                .map((keyword) => '(' + escapeRegExp(keyword) + ')')
                .join('|') + '(.)',
            'gi',
        );

        // エスケープされたキーワードをマッチさせ、強調表示
        return line.replace(regex, (match) => {
            for (let i = 1; i < keywords.length + 1; i++) {
                if (match[i]) {
                    return `<span class="keyword" style="color: red">${escapeHtml(match)}</span>`;
                }
            }
            return escapeHtml(match[0]);
        });
    }
</script>

<div>
    <button
        on:click={handleOnClick}
        class:active={selectedItem.filename === fileItem.filename}
        ><span class="title">{fileItem.title}</span>
        {#if matchLines && searchWords}
            {#each matchLines as line}
                <span class="match-line" data-lineNumber={line.lineNumber}>
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html highlightKeyword(line.content, searchWords)}</span
                >
            {/each}
        {/if}
        <span class="mtime">{formatEpochSeconds()}</span>
        <span class="filename">{fileItem.filename.replace(/.+\//, '')}</span>
    </button>
</div>

<style>
    button {
        width: 100%;

        background: none;
        color: inherit;
        border: none;
        padding: 8px;
        margin: 0;
        font: inherit;
        cursor: pointer;
        border-bottom: darkslategrey 1px solid;

        text-align: left;
        overflow-x: hidden;
    }

    .mtime {
        display: block;
        font-size: 60%;
        color: darkgrey;
        float: left;
    }

    .match-line {
        font-size: 80%;
        display: block;
        border-bottom: 1px darkgrey dotted;
    }

    .title {
        display: block;
        overflow-y: hidden;
        min-height: 1em;
    }

    .filename {
        color: darkgrey;
        font-size: 80%;
        float: right;
    }

    button.active {
        background-color: midnightblue;
    }
</style>

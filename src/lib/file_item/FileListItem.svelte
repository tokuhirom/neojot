<script lang="ts">
    import type { FileItem, MatchedLine } from './FileItem';
    import { emit, listen } from '@tauri-apps/api/event';
    import { onMount } from 'svelte';
    import { format } from 'date-fns';
    import { loadExcalidrawImage } from '../excalidraw/ExcalidrawUtils';
    import {
        searchKeywordStore,
        searchRegexesStore,
        selectedItemStore,
    } from '../../Stores';

    export let fileItem: FileItem;
    export let matchLines: MatchedLine[] | undefined;
    export let enterViewerMode: () => void = () => {};
    export let viewerMode: boolean = false;
    let migemoRegexes: RegExp[] | undefined = undefined;
    searchRegexesStore.subscribe((value) => {
        migemoRegexes = value;
    });

    let searchWords: string[] | undefined = undefined;

    searchWords =
        $searchKeywordStore.length > 0
            ? $searchKeywordStore.split(/\s+/)
            : undefined;

    onMount(async () => {
        const unlisten = await listen('change_title', (e) => {
            const payload = e.payload as { filename: string };
            if (payload.filename === fileItem.filename) {
                fileItem = fileItem;
            }
        });
        return () => {
            unlisten();
        };
    });

    function handleOnClick(e: Event) {
        console.log('handleOnClick', fileItem.filename);
        if (
            $selectedItemStore &&
            fileItem.filename === $selectedItemStore.filename
        ) {
            console.log('Clicked already selected item. Entering viewer mode.');
            enterViewerMode();
            return;
        }

        $selectedItemStore = fileItem;

        const elem = e.target as HTMLElement;
        const lineNumber = elem.getAttribute('data-lineNumber');
        if (lineNumber && lineNumber.length) {
            emit('go-to-line-number', parseInt(lineNumber, 10));
        }
    }

    function formatEpochSeconds() {
        const epochSeconds = fileItem.mtime;
        const date = new Date(epochSeconds * 1000);
        return format(date, 'yyyy-MM-dd HH:mm');
    }

    function highlightKeyword(
        line: string,
        migemoRegexes: RegExp[] | undefined,
    ): string {
        if (!migemoRegexes || migemoRegexes.length == 0) {
            return line;
        }

        // HTMLエンティティにエスケープする関数
        const escapeHtml = (text: string) => {
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        };

        // エスケープされたキーワード用の正規表現を構築
        const regex = new RegExp(
            migemoRegexes.map((re) => '(' + re.source + ')').join('|') +
                '|' +
                '(.)',
            'gi',
        );

        // エスケープされたキーワードをマッチさせ、強調表示
        return line.replace(regex, (match) => {
            for (let i = 1; i < migemoRegexes.length + 1; i++) {
                if (match[i]) {
                    return `<span class="keyword" style="color: red">${escapeHtml(match)}</span>`;
                }
            }
            return escapeHtml(match[0]);
        });
    }

    let buttonElement;

    selectedItemStore.subscribe((value) => {
        if (value && value.filename === fileItem.filename) {
            scrollToView();
        }
    });

    function scrollToView() {
        if (buttonElement) {
            buttonElement.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }

    let imgSrc: string | undefined;

    onMount(async () => {
        imgSrc = await loadExcalidrawImage(fileItem);
    });
    $: if (fileItem) {
        loadExcalidrawImage(fileItem).then((src) => {
            imgSrc = src;
        });
    }
</script>

<div>
    <button
        bind:this={buttonElement}
        on:click={handleOnClick}
        class:active={$selectedItemStore &&
            $selectedItemStore.filename === fileItem.filename}
        class:viewer-mode={viewerMode}
        ><span class="title">{fileItem.title}</span>
        {#if matchLines && searchWords}
            {#each matchLines as line}
                <span class="match-line" data-lineNumber={line.lineNumber}>
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html highlightKeyword(line.content, migemoRegexes)}</span
                >
            {/each}
        {/if}
        {#if imgSrc}
            <img
                alt="excalidraw"
                style="max-height: 100px; max-width: 100%"
                src={imgSrc}
            />
        {/if}
        <span class="mtime">{formatEpochSeconds()}</span>
        <span class="filename" title={fileItem.filename}
            >{fileItem.filename
                .replace(/.+\//, '')
                .replace(/\.excalidraw\./, '.e..')}</span
        >
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

    .viewer-mode.active {
        border: 1px solid red;
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

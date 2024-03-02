<script lang="ts">
    import EntryView from '../markdown/EntryView.svelte';
    import FileListItem from '../file_item/FileListItem.svelte';
    import {
        type FileItem,
        type MatchedLine,
        shouldShowFileItem,
    } from '../file_item/FileItem';
    import LinkCards from '../link/LinkCards.svelte';
    import ClearableSearchBox from '../search/ClearableSearchBox.svelte';
    import {
        calculateFreshness,
        extractTasks,
        getTaskIcon,
        sortTasks,
        type Task,
    } from '../task/Task';
    import { onMount } from 'svelte';
    import { format } from 'date-fns';
    import TaskIcon from '../task/TaskIcon.svelte';

    export let allFileItems: FileItem[] = [];
    export let dataFileItems: FileItem[] = [];
    export let selectedItem: FileItem | undefined = undefined;
    export let onSelectItem: (fileItem: FileItem | undefined) => void;
    export let title2fileItem: Record<string, FileItem>;
    export let comefromLinks: Record<string, FileItem>;
    let tasks: Task[] = [];

    onMount(() => {
        updateTasks();
    });

    function updateTasks() {
        const today = new Date();
        tasks = sortTasks(extractTasks(dataFileItems)).filter((task) => {
            return calculateFreshness(task, today) >= 0;
        });
    }

    type SearchResult = {
        lines: MatchedLine[];
        fileItem: FileItem;
    };

    let searchResult: SearchResult[];

    let searchWord = '';

    $: if (dataFileItems || searchWord) {
        const r: SearchResult[] = [];
        dataFileItems.forEach((fileItem) => {
            if (shouldShowFileItem(fileItem, searchWord)) {
                const lines: MatchedLine[] = [];
                if (searchWord.length > 0) {
                    const contentLines = fileItem.content.split(/\n/);
                    const lowerWords = searchWord.toLowerCase().split(/\s+/);
                    contentLines.filter((line, index) => {
                        if (
                            lowerWords.some((word) =>
                                line.toLowerCase().includes(word),
                            ) &&
                            !(
                                (line.startsWith('# ') ||
                                    line.startsWith('<<< ')) &&
                                line
                                    .toLowerCase()
                                    .includes(searchWord.toLowerCase())
                            )
                        ) {
                            lines.push({
                                content: line,
                                lineNumber: index + 1,
                            } as MatchedLine);
                        }
                    });
                }
                r.push({ lines: lines, fileItem });
            }
        });

        searchResult = r;
    }

    function onSaved() {
        selectedItem = selectedItem;
        updateTasks();
    }

    function onCreateItem(fileItem: FileItem) {
        dataFileItems.unshift(fileItem);
        allFileItems.unshift(fileItem);
        dataFileItems = dataFileItems;
        allFileItems = allFileItems;
        onSelectItem(fileItem);
    }
</script>

<div class="list-view">
    <div class="file-list">
        {#each tasks as task}
            <button
                class="task {task.type.toLowerCase()}"
                on:click={() => onSelectItem(task.fileItem)}
            >
                <TaskIcon {task} />
                {task.type}
                {#if task.scheduled && task.type === 'PLAN'}
                    {format(task.scheduled, 'yyyy-MM-dd(EEE)')}
                {/if}
                {task.title}
            </button>
        {/each}

        <ClearableSearchBox bind:searchWord />
        {#if searchResult && selectedItem}
            {#each searchResult as result}
                <FileListItem
                    {onSelectItem}
                    fileItem={result.fileItem}
                    matchLines={result.lines}
                    {searchWord}
                    {selectedItem}
                />
            {/each}
        {/if}
    </div>
    <div class="log-view">
        {#if selectedItem !== undefined}
            <EntryView
                file={selectedItem}
                {allFileItems}
                {onSelectItem}
                {onSaved}
                {onCreateItem}
                {title2fileItem}
                {comefromLinks}
                search={(keyword) => (searchWord = keyword)}
            />
            <LinkCards
                file={selectedItem}
                {allFileItems}
                {onSelectItem}
                {onCreateItem}
            />
        {/if}
    </div>
</div>

<style>
    .task {
        text-align: left;
        width: 100%;
        font-size: 100%;

        background-color: darkslategrey;
        color: inherit;
        border: none;
        padding: 8px;
        cursor: pointer;
        border-bottom: darkslategrey 1px solid;
        margin-bottom: 9px;
    }

    .task.plan {
        background-color: #f0f0f0;
        color: black;
    }
    .task.doing {
        background-color: bisque;
        color: black;
    }

    .list-view {
        display: flex; /* Enables Flexbox */
        flex-direction: row; /* Stack children vertically */
        height: 100vh;
        padding-left: 8px;
        padding-right: 8px;
    }

    .file-list {
        flex: 0 0 250px;
        overflow-y: auto;
        padding-right: 9px;
        padding-left: 4px;
        overflow-x: hidden;
        word-break: break-word;
        white-space: normal;
    }

    .log-view {
        flex: 0 0 68%;
        /*overflow-x: hidden;*/
        padding-inline-start: 0;
        flex-grow: 1;
        margin-block-start: 0;
        margin-block-end: 0;
        height: 100vh;
        overflow-y: scroll;
    }
</style>

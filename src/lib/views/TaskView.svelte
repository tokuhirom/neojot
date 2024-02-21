<script lang="ts">
    import { onMount } from 'svelte';
    import { type FileItem } from '../file_item/FileItem';
    import EntryView from '../markdown/EntryView.svelte';
    import LinkCards from '../link/LinkCards.svelte';

    export let allFileItems: FileItem[] = [];
    export let dataFileItems: FileItem[] = [];
    export let selectedItem: FileItem | undefined = undefined;
    export let onSelectItem: (FileItem) => void;
    let filteredFileItems: FileItem[] = [];
    let tasks: Task[] = [];

    export type Task = {
        date: string;
        symbol: string;
        duration: number;
        title: string;
        fileItem: FileItem;
    };
    function extractTasks(fileItems: FileItem[]): Task[] {
        const tasks: Task[] = [];
        const regex = /^\[(\d{4}-\d\d-\d\d)]([!.])(\d*)\s+(.+)/;

        fileItems.forEach((fileItem) => {
            fileItem.content.split('\n').forEach((line) => {
                const match = line.match(regex);
                if (match) {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const [_p, date, symbol, duration, title] = match;
                    tasks.push({
                        date,
                        symbol,
                        duration: parseInt(duration) || 0,
                        title,
                        fileItem,
                    });
                }
            });
        });

        return tasks;
    }

    function sortTasks(tasks: Task[]): Task[] {
        // 未完了タスクと完了済みタスクに分ける
        const incompleteTasks = tasks.filter((task) => task.symbol !== '.');
        const completedTasks = tasks.filter((task) => task.symbol === '.');

        // 未完了タスクを日付で昇順にソート
        incompleteTasks.sort((a, b) => {
            if (a.date < b.date) return -1;
            if (a.date > b.date) return 1;
            return 0;
        });

        // 完了済みタスクはそのまま末尾に追加
        return [...incompleteTasks, ...completedTasks];
    }

    onMount(async () => {
        filteredFileItems = dataFileItems.filter((it) =>
            it.title.includes('TODO:'),
        );
        tasks = sortTasks(extractTasks(dataFileItems));
        selectedItem = filteredFileItems[0];
    });

    function onSaved() {
        selectedItem = selectedItem;
    }

    function onCreateItem(fileItem: FileItem) {
        dataFileItems.unshift(fileItem);
        allFileItems.unshift(fileItem);
        dataFileItems = dataFileItems;
        allFileItems = allFileItems;
        onSelectItem(fileItem);
    }

    function determineClass(task) {
        const today = new Date().toISOString().split('T')[0];
        if (task.symbol === '.') {
            return 'done';
        } else if (task.symbol === '!' && task.date === today) {
            return 'today';
        } else if (task.symbol === '!' && task.date < today) {
            return 'overdue';
        }
        return '';
    }
</script>

<div class="task-view">
    <div class="file-list">
        {#each tasks as task}
            <button
                on:click={() => onSelectItem(task.fileItem)}
                class={determineClass(task)}
            >
                <span class="date">{task.date}{task.symbol}</span>
                <span class="title">{task.title}</span>
                <span class="file-title">{task.fileItem.title}</span>
            </button>
        {/each}
    </div>
    <div class="log-view">
        {#if selectedItem !== undefined}
            <EntryView
                file={selectedItem}
                {allFileItems}
                {onSelectItem}
                {onSaved}
                {onCreateItem}
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
    .task-view {
        display: flex; /* Enables Flexbox */
        flex-direction: row; /* Stack children vertically */
        height: 100vh;
        padding-left: 8px;
        padding-right: 8px;
    }
    .file-list {
        flex: 0 0 30%;
        overflow-y: auto;
        padding-right: 9px;
        padding-left: 4px;
        overflow-x: hidden;
        word-break: break-word;
        white-space: normal;
    }
    .file-list button {
        display: block;
        word-break: break-all;
        width: 100%;
        text-align: left;
        background: none;
        color: inherit;
        border: none;
        padding: 8px;
        margin: 0;
        font: inherit;
        cursor: pointer;
        border-bottom: darkslategrey 1px solid;
        overflow-x: hidden;
    }
    .log-view {
        flex: 0 0 68%;
        /*overflow-x: hidden;*/
        padding-inline-start: 0;
        flex-grow: 1;
        margin-block-start: 0;
        margin-block-end: 0;
    }

    .date {
        display: block;
    }
    .title {
        display: block;
    }
    .file-title {
        display: block;
        font-size: 80%;
    }

    /* 完了済みタスク */
    .done {
        color: #757575;
        text-decoration: line-through;
        background-color: #f0f0f0;
    }

    /* 今日が期限のタスク */
    .today {
        color: #007bff !important;
        background-color: #007bff; /* 明るい青、Bootstrapのプライマリーカラーを参考 */
        border-color: #007bff;
    }

    /* 期限切れのタスク */
    .overdue {
        color: #dc3545 !important;
    }
</style>

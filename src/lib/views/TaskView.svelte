<script lang="ts">
    import { onMount } from 'svelte';
    import { type FileItem } from '../file_item/FileItem';
    import EntryView from '../markdown/EntryView.svelte';
    import LinkCards from '../link/LinkCards.svelte';
    import { format } from 'date-fns';

    export let allFileItems: FileItem[] = [];
    export let dataFileItems: FileItem[] = [];
    export let selectedItem: FileItem | undefined = undefined;
    export let onSelectItem: (FileItem) => void;
    let tasks: Task[] = [];

    export type Task = {
        date: Date;
        symbol: string;
        duration: number;
        title: string;
        fileItem: FileItem;
    };

    // 旬度を計算する関数
    function calculateFreshness(task: Task, today: Date): number {
        const taskDate = new Date(task.date);
        const diffDays =
            (taskDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
        let freshness = 0;

        switch (task.symbol) {
            case '@':
                // 予定は常に同じ旬度
                freshness = 0;
                break;
            case '+':
                // todo: 指定日になってから7日間かけて徐々に浮かび続ける
                if (diffDays <= 0 && diffDays > -task.duration) {
                    freshness = diffDays + task.duration;
                }
                break;
            case '!':
                // 〆切: 指定日の7日前から徐々に浮かび、指定日以降浮きっぱなし
                if (diffDays <= task.duration) {
                    freshness = diffDays + task.duration;
                }
                break;
            case '-':
                // 覚書: 指定日に浮かび上がり、以降1日かけて単位量だけ徐々に沈む
                if (diffDays <= 0 && diffDays > -task.duration) {
                    freshness = task.duration + diffDays;
                }
                break;
            case '.':
                // 済み: 常に底
                freshness = -Infinity;
                break;
        }

        return freshness;
    }

    function extractTasks(fileItems: FileItem[]): Task[] {
        // [2003-11-27]@ 予定です
        // [2003-11-27]- 覚書です
        // [2003-11-27]+ ToDoです
        // [2003-11-27]! 〆切です

        const tasks: Task[] = [];
        const regex = /^\[(\d{4}-\d\d-\d\d)]([!.@+-])(\d*)\s+(.+)/;

        // 数字をつけなかったときのデフォルトは, 「-1」「+7」「!7」
        // https://kaorahi.github.io/howm/uu/#foottext:15
        const defaultDuration = {
            '-': 1,
            '+': 7,
            '!': 7,
        };

        fileItems.forEach((fileItem) => {
            fileItem.content.split('\n').forEach((line) => {
                const match = line.match(regex);
                if (match) {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const [_p, date, symbol, duration, title] = match;
                    const parsedDate = Date.parse(date);
                    console.log(parsedDate);
                    tasks.push({
                        date: parsedDate as Date,
                        symbol,
                        duration:
                            parseInt(duration) || defaultDuration[symbol] || 0,
                        title,
                        fileItem,
                    });
                }
            });
        });

        return tasks;
    }

    function sortTasks(tasks: Task[]): Task[] {
        console.log(tasks.length);
        const today = new Date();
        tasks.sort(
            (a, b) =>
                calculateFreshness(b, today) - calculateFreshness(a, today),
        );
        return tasks;
    }

    onMount(() => {
        tasks = sortTasks(extractTasks(dataFileItems));
        if (tasks.length > 0) {
            selectedItem = tasks[0].fileItem;
        }
    });

    $: if (dataFileItems) {
        tasks = sortTasks(extractTasks(dataFileItems));
        if (tasks.length > 0) {
            selectedItem = tasks[0].fileItem;
        }
    }

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

    function taskType(task: Task) {
        switch (task.symbol) {
            case '@':
                return 'Schedule';
            case '+':
                return 'Todo';
            case '!':
                return 'Deadline';
            case '-':
                return 'Memo';
            case '.':
                return 'Completed';
            default:
                return 'Unknown';
        }
    }
</script>

<div class="task-view">
    <div class="file-list">
        {#each tasks as task}
            <button
                on:click={() => onSelectItem(task.fileItem)}
                class={determineClass(task)}
            >
                <span class="header">
                    <span class="date">{format(task.date, 'yyyy-MM-dd')}</span>
                    <span class="task">{taskType(task)} </span>
                </span>
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

    .header {
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

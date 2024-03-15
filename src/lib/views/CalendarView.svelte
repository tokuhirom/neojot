<script lang="ts">
    import { onMount } from 'svelte';
    import type { FileItem } from '../file_item/FileItem';
    import EntryView from '../markdown/EntryView.svelte';
    import LinkCards from '../link/LinkCards.svelte';
    import CalendarTable from '../calendar/CalendarTable.svelte';

    export let onSelectItem: (fileItem: FileItem | undefined) => void;
    export let allFileItems: FileItem[] = [];
    export let dataFileItems: FileItem[] = [];
    export let selectedItem: FileItem | undefined = undefined;
    export let title2fileItem: Record<string, FileItem>;
    export let comefromLinks: Record<string, FileItem>;
    export let findEntryByTitle: (title: string) => FileItem | undefined;

    let year: number;
    let month: number;

    onMount(async () => {
        const currentDate = new Date();
        year = currentDate.getFullYear();
        month = currentDate.getMonth() + 1;
    });

    function openFile(fileItem: FileItem) {
        selectedItem = fileItem;
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

    function gotoPrevMonth() {
        month--;
        if (month < 1) {
            year--;
            month = 12;
        }
    }

    function gotoNextMonth() {
        month++;
        if (month > 12) {
            year++;
            month = 1;
        }
    }
</script>

<div class="calendar-view">
    <div class="calendar">
        {#if month}
            <div class="header">
                <button on:click={gotoPrevMonth} class="month-nav">Prev</button>
                <h1>{year}-{month.toString().padStart(2, '0')}</h1>
                <button on:click={gotoNextMonth} class="month-nav">Next</button>
            </div>
            <CalendarTable {allFileItems} {onSelectItem} {year} {month} />
        {/if}
    </div>
    <div class="log-view">
        {#if selectedItem !== undefined}
            {#if selectedItem.filename.startsWith('archived/')}
                <div class="archived">Archived</div>
            {/if}
            <EntryView
                file={selectedItem}
                fileItems={dataFileItems}
                onSelectItem={openFile}
                {onSaved}
                {onCreateItem}
                {title2fileItem}
                {comefromLinks}
                search={undefined}
                {findEntryByTitle}
            />
            <LinkCards
                file={selectedItem}
                {allFileItems}
                onSelectItem={openFile}
                {onCreateItem}
            />
        {/if}
    </div>
</div>

<style>
    .header {
        display: flex; /* Flexbox を有効化 */
        justify-content: center; /* 中央揃え */
        align-items: center; /* アイテムを垂直方向の中央に配置 */
        margin-bottom: 20px; /* 下部にマージンを設定 */
    }

    .month-nav {
        margin: 0 20px; /* ボタンの外側にマージンを設定 */
        padding: 5px 10px; /* ボタン内のパディング */
        background-color: #757575; /* ボタンの背景色 */
        border: 1px solid #ccc; /* ボタンの境界線 */
        border-radius: 4px; /* ボタンの角を丸くする */
        cursor: pointer; /* カーソルをポインタにする */
    }

    .month-nav:hover {
        background-color: #e9e9e9; /* ホバー時の背景色を変更 */
    }

    .archived {
        margin: 8px;
        padding: 8px;
        border: orange;
        background-color: bisque;
        border-radius: 8px;
        color: #0f0f0f;
    }

    .calendar-view {
        display: flex; /* Enables Flexbox */
        flex-direction: row; /* Stack children vertically */
        height: 100vh;
        padding-left: 8px;
        padding-right: 8px;
    }
    .calendar {
        flex: 0 0 50%;
        overflow-y: auto;
        padding-right: 9px;
        padding-left: 4px;
        overflow-x: hidden;
        word-break: break-word;
        white-space: normal;
        height: 100vh;
    }

    .log-view {
        flex: 0 0 58%;
        /*overflow-x: hidden;*/
        padding-inline-start: 0;
        flex-grow: 1;
        margin-block-start: 0;
        margin-block-end: 0;
        height: 100vh;
        overflow-y: scroll;
    }
</style>

<script lang="ts">
    import CardView from './lib/views/CardView.svelte';
    import ListView from './lib/views/ListView.svelte';
    import ArchiveView from './lib/views/ArchiveView.svelte';
    import TaskView from './lib/views/TaskView.svelte';
    import CalendarView from './lib/views/CalendarView.svelte';
    import { listen, type UnlistenFn } from '@tauri-apps/api/event';
    import { onDestroy, onMount } from 'svelte';
    import ConfigurationView from './lib/views/ConfigurationView.svelte';
    import {
        archiveFile,
        createNewFileWithContent,
        deleteArchivedFile,
        loadFileList,
        loadMarkdownFile,
    } from './lib/repository/NodeRepository';
    import type { FileItem } from './lib/file_item/FileItem';

    let tabPane = 'list';
    let selectedItem: FileItem | undefined = undefined;
    let allFileItems: FileItem[] = [];
    let dataFileItems: FileItem[] = [];
    let archivedFileItems: FileItem[] = [];

    onMount(async () => {
        await reloadFiles();
        if (dataFileItems.length > 0) {
            selectedItem = dataFileItems[0];
        }
    });

    let previousTabPane;
    $: if (tabPane !== previousTabPane) {
        previousTabPane = tabPane;

        console.log(`Switched tabPane to ${tabPane}`);
        if (tabPane === 'list') {
            if (dataFileItems.length > 0) {
                selectedItem = dataFileItems[0];
            } else {
                selectedItem = undefined;
            }
        } else {
            selectedItem = undefined;
        }
    }

    async function reloadFiles() {
        const data = await loadFileList('data');
        data.sort((a, b) => b.mtime - a.mtime); // sort it.
        dataFileItems = data;

        const archived = await loadFileList('archived');
        archived.sort((a, b) => b.mtime - a.mtime); // sort it.
        archivedFileItems = archived;

        allFileItems = archived.concat(data);
    }

    async function archiveOrDeleteEntry(
        fileItem: FileItem,
    ): Promise<FileItem | undefined> {
        if (fileItem.filename.startsWith('archived/')) {
            console.log(`Deleting: ${fileItem.filename}`);
            await deleteArchivedFile(fileItem);
            await reloadFiles();
        } else {
            console.log(`Archiving: ${fileItem.filename}`);
            await archiveFile(fileItem);
            await reloadFiles();
        }

        if (tabPane === 'archive') {
            return undefined;
        } else {
            return dataFileItems[0];
        }
    }

    let unlistenCallbackPromises: UnlistenFn[] = [];

    onMount(async () => {
        console.log(`Register callbacks: ${unlistenCallbackPromises.length}!`);
        for (let p of ['card', 'list', 'task', 'calendar', 'archive']) {
            unlistenCallbackPromises.push(
                await listen(`do_${p}_view`, () => {
                    console.log(`${p}_view`);
                    tabPane = `${p}`;

                    if (p === 'archive') {
                        selectedItem = undefined;
                    }
                }),
            );
        }
        unlistenCallbackPromises.push(
            await listen('sort_file_list', async () => {
                dataFileItems.sort((a, b) => b.mtime - a.mtime);
                dataFileItems = dataFileItems;
            }),
        );
        unlistenCallbackPromises.push(
            await listen('do_new_file', async () => {
                console.log('do_new_file');

                const fileItem = await createNewFileWithContent('# \n\n');

                if (tabPane !== 'list' && tabPane !== 'card') {
                    tabPane = 'list';
                }

                dataFileItems.unshift(fileItem);
                allFileItems.unshift(fileItem);

                dataFileItems = dataFileItems; // reload ListView's file list.

                selectedItem = fileItem;
            }),
        );
        unlistenCallbackPromises.push(
            await listen('do_archive', async () => {
                if (selectedItem) {
                    selectedItem = await archiveOrDeleteEntry(selectedItem);
                }
            }),
        );
    });
    onDestroy(async () => {
        for (let unlistenCallbackPromise of unlistenCallbackPromises) {
            unlistenCallbackPromise();
        }
    });

    async function onSelectItem(fileItem: FileItem | undefined) {
        console.log(
            `onSelectItem: ${fileItem ? fileItem.filename : 'undefined'}`,
        );
        if (fileItem != undefined) {
            fileItem.content = await loadMarkdownFile(fileItem.filename);
        }
        selectedItem = fileItem;
    }
</script>

<main class="container">
    <div class="sidemenu">
        <button
            on:click={() => (tabPane = 'card')}
            class:active={tabPane === 'card'}>🗃️</button
        >
        <button
            on:click={() => (tabPane = 'list')}
            class:active={tabPane === 'list'}>📝</button
        >
        <button
            on:click={() => (tabPane = 'task')}
            class:active={tabPane === 'task'}>✅</button
        >
        <button
            on:click={() => (tabPane = 'calendar')}
            class:active={tabPane === 'calendar'}>📆</button
        >
        <button
            on:click={() => (tabPane = 'archive')}
            class:active={tabPane === 'archive'}>♻️</button
        >
        <button
            on:click={() => (tabPane = 'configuration')}
            class:active={tabPane === 'configuration'}>⚙️</button
        >
    </div>
    <div class="main">
        {#if tabPane === 'list'}
            <ListView
                {allFileItems}
                {dataFileItems}
                {selectedItem}
                {onSelectItem}
            />
        {:else if tabPane === 'archive'}
            <ArchiveView
                {selectedItem}
                {archivedFileItems}
                {onSelectItem}
                {archiveOrDeleteEntry}
            />
        {:else if tabPane === 'task'}
            <TaskView
                {allFileItems}
                {dataFileItems}
                {selectedItem}
                {onSelectItem}
            />
        {:else if tabPane === 'calendar'}
            <CalendarView
                {allFileItems}
                {dataFileItems}
                {onSelectItem}
                {selectedItem}
            />
        {:else if tabPane === 'configuration'}
            <ConfigurationView />
        {:else}
            <CardView
                {allFileItems}
                {dataFileItems}
                {selectedItem}
                {onSelectItem}
            />
        {/if}
    </div>
</main>

<style>
    .container {
        display: flex; /* Enables Flexbox */
        flex-direction: row; /* Stack children vertically */
        height: 100vh;
        padding-left: 8px;
        padding-right: 8px;
    }

    .sidemenu {
        flex: 0 0 20px;
        padding-right: 9px;
        padding-left: 4px;
    }
    .sidemenu button.active {
        background-color: #646cff;
    }
    .sidemenu button {
        width: 40px;
        background-color: darkslategrey;
        color: inherit;
        border: none;
        padding: 8px;
        margin: 2px;
        font: inherit;
        cursor: pointer;
        border-bottom: darkslategrey 1px solid;
    }

    .main {
        flex-grow: 1;
    }
</style>

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
    } from './lib/repository/NodeRepository';
    import { type FileItem, loadImage } from './lib/file_item/FileItem';
    import ManualView from './lib/views/ManualView.svelte';
    import { initGit } from './lib/git/GitCommands';
    import { cachedExtractLinks } from './lib/file_item/AutoLinks';
    import {
        dataFileItemsStore,
        lowerTitle2fileItemStore,
        openaiTokenStore,
        promptsStore,
        searchKeywordStore,
        selectedItemStore,
    } from './Stores';
    import { extractTasks } from './lib/task/Task';
    import { tasksStore } from './Stores.js';
    import { invoke } from '@tauri-apps/api/core';
    import type { Prompt } from './lib/openai/Prompt';
    import NetworkView from './lib/views/NetworkView.svelte';

    let tabPane = 'list';
    let selectedItem: FileItem | undefined = undefined;
    selectedItemStore.subscribe((value) => {
        selectedItem = value;
    });

    let dataFileItems: FileItem[] = [];
    let imageLoadQueue: FileItem[] = [];
    let imageLoadInterval: number | undefined = undefined;
    dataFileItemsStore.subscribe((value) => {
        dataFileItems = value;

        // load image cache
        imageLoadQueue = dataFileItems.filter(
            (fileItem) => fileItem.imgSrc === undefined,
        );
        if (imageLoadInterval === undefined) {
            imageLoadInterval = setInterval(async () => {
                if (imageLoadQueue.length > 0) {
                    const fileItem = imageLoadQueue.pop();
                    if (fileItem && fileItem.imgSrc === undefined) {
                        fileItem.imgSrc = await loadImage(fileItem);
                    }
                } else {
                    if (imageLoadInterval !== undefined) {
                        clearInterval(imageLoadInterval);
                    }
                }
            }, 10);
        }
    });

    onMount(async () => {
        try {
            const openaiToken = (await invoke('get_openai_token')) as string;
            if (openaiToken) {
                openaiTokenStore.set(openaiToken);
            }
        } catch (e) {
            console.error(e);
        }
        try {
            const prompts = (await invoke('get_openai_prompts')) as Prompt[];
            if (prompts) {
                promptsStore.set(prompts);
            }
        } catch (e) {
            console.error(e);
        }

        const items = await reloadFiles();
        console.log(`Loaded ${items.length} items!`);
        if (items.length > 0) {
            selectedItemStore.set(items[0]);
            selectedItem = items[0];
        }

        await initGit();
    });

    let previousTabPane;
    $: if (tabPane !== previousTabPane) {
        previousTabPane = tabPane;

        console.log(`Switched tabPane to ${tabPane}`);
        if (tabPane === 'list') {
            if (dataFileItems.length > 0) {
                selectedItemStore.set(dataFileItems[0]);
            } else {
                selectedItemStore.set(undefined);
            }
        } else {
            selectedItemStore.set(undefined);
        }
    }

    async function reloadFiles(): Promise<FileItem[]> {
        const data = await loadFileList('data');
        $dataFileItemsStore = data;
        return data;
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
            await listen('do_new_file', async () => {
                console.log('do_new_file');

                const fileItem = await createNewFileWithContent('# \n\n');

                if (tabPane !== 'list' && tabPane !== 'card') {
                    tabPane = 'list';
                }

                $dataFileItemsStore = [fileItem, ...$dataFileItemsStore];
                $selectedItemStore = fileItem;
                $searchKeywordStore = '';
            }),
        );
        unlistenCallbackPromises.push(
            await listen('do_archive', async () => {
                if (selectedItem) {
                    selectedItem = await archiveOrDeleteEntry(selectedItem);
                    $selectedItemStore = selectedItem;
                }
            }),
        );
        unlistenCallbackPromises.push(
            await listen('do_new_excalidraw', async () => {
                await reloadFiles();
            }),
        );
    });
    onDestroy(async () => {
        for (let unlistenCallbackPromise of unlistenCallbackPromises) {
            unlistenCallbackPromise();
        }
    });

    // タイトルの補完用に使う配列
    let pageTitles: string[];
    // Target of auto links.
    let autoLinks: string[];
    // For findEntryByTitle
    let lowerTitle2fileItem: Record<string, FileItem> = {};
    $: if (dataFileItems) {
        const t1 = Date.now();
        const lowerMap: Record<string, FileItem> = {};
        const newAutoLinks = [];
        const newPageTitles = [];
        dataFileItems.forEach((fileItem) => {
            lowerMap[fileItem.title.toLowerCase()] = fileItem;

            const aliases = cachedExtractLinks(fileItem, 'ALIAS');
            newPageTitles.push(fileItem.title);
            if (aliases.length > 0) {
                newPageTitles.push(...aliases);
                aliases.forEach((alias) => {
                    lowerMap[alias.toLowerCase()] = fileItem;
                });
            }

            const autoLinks = cachedExtractLinks(fileItem, 'AUTOLINK');
            if (autoLinks.length > 0) {
                newAutoLinks.push(...autoLinks);
                autoLinks.forEach((link) => {
                    lowerMap[link.toLowerCase()] = fileItem;
                });
            }
        });
        console.log(`lowerTitle2fileItem: ${Date.now() - t1}ms`);
        lowerTitle2fileItem = lowerMap;
        lowerTitle2fileItemStore.set(lowerMap);
        autoLinks = newAutoLinks;
        pageTitles = newPageTitles;
    }

    function findEntryByTitle(title: string): FileItem | undefined {
        return lowerTitle2fileItem[title.toLowerCase()];
    }

    dataFileItemsStore.subscribe((value) => {
        const tasks = extractTasks(value);
        tasksStore.set(tasks);
    });
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
            on:click={() => (tabPane = 'network')}
            class:active={tabPane === 'network'}>🦑</button
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
            on:click={() => (tabPane = 'manual')}
            class:active={tabPane === 'manual'}
            >&#129489;&#8205;&#127979;️</button
        >
        <button
            on:click={() => (tabPane = 'configuration')}
            class:active={tabPane === 'configuration'}>⚙️</button
        >
    </div>
    <div class="main">
        {#if tabPane === 'list'}
            <ListView
                {dataFileItems}
                {pageTitles}
                {findEntryByTitle}
                {autoLinks}
            />
        {:else if tabPane === 'archive'}
            <ArchiveView />
        {:else if tabPane === 'task'}
            <TaskView
                {dataFileItems}
                {pageTitles}
                {findEntryByTitle}
                {autoLinks}
            />
        {:else if tabPane === 'calendar'}
            <CalendarView {pageTitles} {findEntryByTitle} {autoLinks} />
        {:else if tabPane === 'manual'}
            <ManualView />
        {:else if tabPane === 'configuration'}
            <ConfigurationView />
        {:else if tabPane === 'network'}
            <NetworkView {pageTitles} {findEntryByTitle} {autoLinks} />
        {:else}
            <CardView
                {dataFileItems}
                {pageTitles}
                {findEntryByTitle}
                {autoLinks}
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

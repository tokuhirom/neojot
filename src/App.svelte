<script lang="ts">
    import CardView from './lib/CardView.svelte'
    import ListView from './lib/ListView.svelte'
    import ArchiveView from './lib/ArchiveView.svelte'
    import TaskView from './lib/TaskView.svelte'
    import CalendarView from './lib/CalendarView.svelte'
    import { emit, listen, type UnlistenFn } from '@tauri-apps/api/event'
    import { onDestroy } from 'svelte'
    import ConfigurationView from './lib/ConfigurationView.svelte'
    import { createNewFileWithContent } from './lib/repository/NodeRepository'

    let tabPane = 'list'

    let unlistenCallbackPromises: Promise<UnlistenFn>[] = []
    for (let p of ['card', 'list', 'task', 'calendar', 'archive']) {
        unlistenCallbackPromises.push(
            listen(`do_${p}_view`, () => {
                console.log(`${p}_view`)
                tabPane = `${p}`
            }),
        )
    }
    unlistenCallbackPromises.push(
        listen('do_new_file', async () => {
            const fileItem = await createNewFileWithContent('# ')
            await emit('do_created', fileItem)
        }),
    )
    onDestroy(async () => {
        for (let unlistenCallbackPromise of unlistenCallbackPromises) {
            ;(await unlistenCallbackPromise)()
        }
    })
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
            <ListView />
        {:else if tabPane === 'archive'}
            <ArchiveView />
        {:else if tabPane === 'task'}
            <TaskView />
        {:else if tabPane === 'calendar'}
            <CalendarView />
        {:else if tabPane === 'configuration'}
            <ConfigurationView />
        {:else}
            <CardView />
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

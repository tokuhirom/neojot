<script lang="ts">
    import ReactComponent from './ReactComponent.svelte';
    import { Excalidraw, MainMenu } from '@excalidraw/excalidraw';
    import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types.js';
    import type {
        AppState,
        BinaryFiles,
        ExcalidrawImperativeAPI,
        ExcalidrawInitialDataState,
    } from '@excalidraw/excalidraw/types/types.js';
    import React from 'react';
    import { createEventDispatcher } from 'svelte';

    export let initialData: ExcalidrawInitialDataState = {};
    export let onChangeData: (
        elements: ExcalidrawElement[],
        appState: AppState,
        files: BinaryFiles,
    ) => void;
    let excalidrawAPI: ExcalidrawImperativeAPI;

    function setAPI(api: ExcalidrawImperativeAPI) {
        console.log('SET API');
        excalidrawAPI = api;
        dispatcher('init');
    }

    const dispatcher = createEventDispatcher<{
        init: void;
        change: { elements: ExcalidrawElement[]; state: AppState };
        blob: Blob;
    }>();

    function onChange(
        elements: ExcalidrawElement[],
        appState: AppState,
        files: BinaryFiles,
    ) {
        onChangeData(elements, appState, files);
    }
    const reactMainMenu = React.createElement(MainMenu, null, [
        React.createElement(MainMenu.DefaultItems.SaveAsImage, {
            key: 'SaveAsImage',
        }),
        React.createElement(MainMenu.DefaultItems.Export, { key: 'Export' }),
    ]);
</script>

<ReactComponent
    {onChange}
    this={Excalidraw}
    {initialData}
    excalidrawAPI={setAPI}
    langCode="en-EN"
    children={reactMainMenu}
    isCollaborating={false}
/>

<script lang="ts">
    import ReactComponent from './ReactComponent.svelte';
    import { Excalidraw, MainMenu } from '@excalidraw/excalidraw';
    import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types.js';
    import type {
        AppState,
        ExcalidrawImperativeAPI,
        ExcalidrawInitialDataState,
    } from '@excalidraw/excalidraw/types/types.js';
    import React from 'react';
    import { createEventDispatcher } from 'svelte';

    export let initialData: ExcalidrawInitialDataState = {};
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

    function onChange(elements: ExcalidrawElement[], state: AppState) {
        dispatcher('change', { elements, state });
        console.log(`called onChange ${excalidrawAPI}`);
        if (excalidrawAPI) {
            const elements = excalidrawAPI.getSceneElementsIncludingDeleted();
            const appState = excalidrawAPI.getAppState();

            // 描画データとアプリケーションの状態を含むオブジェクトをJSON形式で保存または出力
            const excalidrawData = JSON.stringify({
                type: 'excalidraw',
                version: 2,
                source: 'https://excalidraw.com',
                elements,
                appState,
            });
            console.log(excalidrawData);

            // または、このデータをファイルとして保存するなどの処理をここに追加
        }
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
/>

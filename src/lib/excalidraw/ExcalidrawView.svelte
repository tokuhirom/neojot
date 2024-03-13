<script lang="ts">
    import Excalidraw from './Excalidraw.svelte';
    import type { FileItem } from '../file_item/FileItem';
    import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
    import type {
        AppState,
        BinaryFiles,
        ExcalidrawImperativeAPI,
    } from '@excalidraw/excalidraw/types/types';
    import { mkdir_p, saveMarkdownFile } from '../repository/NodeRepository';
    import { makeExcalidrawThumbnailFilename } from './ExcalidrawUtils';
    import { exportToBlob } from '@excalidraw/excalidraw';
    import { BaseDirectory, writeFile } from '@tauri-apps/plugin-fs';
    import { emit } from '@tauri-apps/api/event';

    export let selectedItem: FileItem;
    let excalidrawApi: ExcalidrawImperativeAPI;

    let prevFilename = selectedItem?.filename;

    $: if (selectedItem) {
        // clear current drawing and load new drawing from the file
        console.log('Restore...');
        if (excalidrawApi && prevFilename !== selectedItem.filename) {
            const data = parseData();
            excalidrawApi.updateScene({
                elements: data?.elements || [],
                appState: data?.appState || {},
            });
            prevFilename = selectedItem.filename;
        }
    }

    function parseData() {
        const json = selectedItem.content;
        const data = JSON.parse(json);
        // なぜか collabolators が残っているとエラーになるので削除。謎。。
        delete data.appState['collaborators'];
        return data;
    }

    async function onChangeData(
        elements: ExcalidrawElement[],
        appState: AppState,
        files: BinaryFiles,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _excalidrawAPI: ExcalidrawImperativeAPI,
    ) {
        // 描画データとアプリケーションの状態を含むオブジェクトをJSON形式で保存または出力
        const excalidrawData = JSON.stringify({
            type: 'excalidraw',
            version: 2,
            source: 'https://excalidraw.com',
            'neojot:title': selectedItem.title,
            elements,
            appState,
            files,
        });

        if (excalidrawData !== selectedItem.content) {
            // selectedItem.content が変更された場合のみ保存する
            selectedItem.content = excalidrawData;

            // ファイルに保存する
            await saveMarkdownFile(selectedItem.filename, selectedItem.content);
            selectedItem.mtime = Math.floor(Date.now() / 1000);
            await emit('sort_file_list');

            // save diagram as a png file.
            const blob = await exportToBlob({
                elements,
                appState,
                files,
                mimeType: 'image/jpeg',
            });

            // convert blob to Uint8Array
            const arrayBuffer = await blob.arrayBuffer();
            // convert ArrayBuffer into Uint8Array
            const uint8Array = new Uint8Array(arrayBuffer);
            await mkdir_p('excalidraw-thumbnails');
            await writeFile(
                makeExcalidrawThumbnailFilename(selectedItem.filename),
                uint8Array,
                { baseDir: BaseDirectory.AppData },
            );
        }
    }

    function onSetAPI(api: ExcalidrawImperativeAPI) {
        excalidrawApi = api;
    }
</script>

<div class="container">
    <input class="title-input" type="text" bind:value={selectedItem.title} />
    <div class="excalidraw">
        <Excalidraw initialData={parseData()} {onChangeData} {onSetAPI} />
    </div>
</div>

<style>
    .container {
        display: flex;
        flex-direction: column;
        height: 100vh; /* 画面の高さいっぱいに */
    }

    .title-input {
        /* inputの高さを設定 */
        height: 50px; /* 適切な高さに設定 */
        padding: 0 10px; /* 見た目を整えるためのパディング */
        box-sizing: border-box; /* パディングとボーダーを高さに含める */
        border: 1px solid #ccc; /* ボーダーを設定 */
        margin: 8px 0; /* 余白を設定 */
    }

    .excalidraw {
        flex-grow: 1; /* 残りのスペースをすべて使用 */
        overflow: hidden; /* 子要素がコンテナを超えた場合にスクロールバーを非表示に */
    }
</style>

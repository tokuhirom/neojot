<script lang="ts">
    import Excalidraw from './Excalidraw.svelte';
    import type { FileItem } from '../file_item/FileItem';
    import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
    import type {
        AppState,
        BinaryFiles,
        ExcalidrawImperativeAPI,
    } from '@excalidraw/excalidraw/types/types';
    import { saveMarkdownFile } from '../repository/NodeRepository';
    import { getExcalidrawTexts } from './ExcalidrawUtils';
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
        // selectedItem.content から ```json と ``` で囲まれた部分をとりだし、JSON.parse して返す
        const content = selectedItem.content;
        const start = content.indexOf('```json');
        const end = content.indexOf('```', start + 1);
        if (start === -1 || end === -1) {
            return null;
        }
        const json = content.substring(start + 7, end);
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
            elements,
            appState,
            files,
        });

        let content = selectedItem.content;

        // content の # Text Elements の直後から %% までの間を texts を改行で連結したものに置き換える
        {
            const texts = getExcalidrawTexts(elements);
            const start = content.indexOf('# Text Elements');
            const end = content.indexOf('%%', start + 1);
            if (start === -1 || end === -1) {
                return;
            }
            content =
                content.substring(0, start + 15) +
                '\n' +
                texts.join('\n') +
                '\n' +
                content.substring(end);
        }

        // selectedItem.content のうち ```json と ``` で囲まれた部分を置き換える。
        const start = content.indexOf('```json');
        const end = content.indexOf('```', start + 1);
        if (start === -1 || end === -1) {
            return;
        }
        content =
            content.substring(0, start + 7) +
            '\n' +
            excalidrawData +
            '\n' +
            content.substring(end);

        if (content !== selectedItem.content) {
            // selectedItem.content が変更された場合のみ保存する
            selectedItem.content = content;

            // ファイルに保存する
            await saveMarkdownFile(selectedItem.filename, selectedItem.content);
            selectedItem.mtime = Math.floor(Date.now() / 1000);
            await emit('sort_file_list');

            // save diagram as a png file.
            const blob = await exportToBlob({
                elements,
                appState,
                files,
                mimeType: 'image/png',
            });

            // convert blob to Uint8Array
            const arrayBuffer = await blob.arrayBuffer();
            // convert ArrayBuffer into Uint8Array
            const uint8Array = new Uint8Array(arrayBuffer);
            await writeFile(
                selectedItem.filename.replace('.md', '.png'),
                uint8Array,
                { baseDir: BaseDirectory.AppData },
            );
        }
    }

    function onSetAPI(api: ExcalidrawImperativeAPI) {
        excalidrawApi = api;
    }
</script>

<Excalidraw initialData={parseData()} {onChangeData} {onSetAPI} />

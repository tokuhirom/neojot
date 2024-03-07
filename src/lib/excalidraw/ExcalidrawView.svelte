<script lang="ts">
    import Excalidraw from './Excalidraw.svelte';
    import type { FileItem } from '../file_item/FileItem';
    import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
    import type {
        AppState,
        BinaryFiles,
    } from '@excalidraw/excalidraw/types/types';
    import { saveMarkdownFile } from '../repository/NodeRepository';

    export let selectedItem: FileItem;

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

    function getTexts(elements: ExcalidrawElement[]): string[] {
        const texts: string[] = [];
        for (const element of elements) {
            if (element.isDeleted) {
                continue;
            }
            if (element.type === 'text') {
                texts.push(element.text);
            }
        }
        return texts;
    }

    async function onChangeData(
        elements: ExcalidrawElement[],
        appState: AppState,
        files: BinaryFiles,
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
            const texts = getTexts(elements);
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
        selectedItem.content =
            content.substring(0, start + 7) +
            '\n' +
            excalidrawData +
            '\n' +
            content.substring(end);

        // ファイルに保存する
        await saveMarkdownFile(selectedItem.filename, selectedItem.content);
    }
</script>

<Excalidraw initialData={parseData()} {onChangeData} />

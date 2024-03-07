<script lang="ts">
    import { cachedLoadImage, type FileItem } from '../file_item/FileItem';
    import CardItem from './CardItem.svelte';
    import { onMount } from 'svelte';
    import { loadExcalidrawImage } from '../excalidraw/ExcalidrawUtils';
    import { BaseDirectory, readFile } from '@tauri-apps/plugin-fs';
    import { uint8ArrayToDataUrl } from '../markdown/ImageViewWidget';

    export let file: FileItem;
    export let onSelectItem: (fileItem: FileItem) => void;
    export let backgroundColor = '#f6f6f6';
    export let color = '#0f0f0f';

    function onClick() {
        onSelectItem(file);
    }

    let title: string | undefined;
    let content: string | undefined;
    let imgSrc: string | undefined;

    onMount(async () => {
        if (file.filename.endsWith('.excalidraw.md')) {
            title = undefined;
            content = undefined;
            imgSrc = await loadExcalidrawImage(file);
        } else {
            title = file.title;
            content = file.content
                .replace(/^<<< .*?$/gms, '')
                .split('\n')
                .slice(1)
                .join('\n');

            // content に markdown の画像記法が含まれていた場合は、それを読み取ります。
            // 次に data scheme で imgSrc に格納します
            imgSrc = await cachedLoadImage(file);
        }
    });
</script>

<CardItem {onClick} {backgroundColor} {color} {title} {content} {imgSrc} />

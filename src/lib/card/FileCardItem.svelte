<script lang="ts">
    import { type FileItem, loadImage } from '../file_item/FileItem';
    import CardItem from './CardItem.svelte';
    import { onMount } from 'svelte';
    import { loadExcalidrawImage } from '../excalidraw/ExcalidrawUtils';
    import { selectedItemStore } from '../../Stores';
    import { extractCardContent } from './CardUtils';

    export let file: FileItem;
    export let backgroundColor = '#f6f6f6';
    export let color = '#0f0f0f';

    function onClick() {
        $selectedItemStore = file;
    }

    let title: string | undefined;
    let content: string | undefined;
    let imgSrc: string | null;

    onMount(async () => {
        await loadFile();
    });
    $: if (file) {
        loadFile();
    }

    async function loadFile() {
        if (file.filename.endsWith('.excalidraw')) {
            title = file.title;
            content = undefined;
            imgSrc = await loadExcalidrawImage(file);
            if (imgSrc === null) {
                console.error('Failed to load excalidraw image');
                title = '**Excalidraw image failed to load**';
            }
        } else {
            title = file.title;
            // ALIAS と AUTOLINK のようなメタデータを削除
            // [[...]] のようなリンク記法を削除
            // 画像記法を削除
            content = extractCardContent(file.content);

            // content に markdown の画像記法が含まれていた場合は、それを読み取ります。
            if (file.imgSrc === undefined) {
                pushToImageLoadQueue(file);
            } else {
                imgSrc = file.imgSrc;
            }
        }
    }

    const queue = [];
    let interval = undefined;
    function pushToImageLoadQueue(file: FileItem) {
        // 画像の読み込みをキューに追加
        queue.push(file);
        if (interval === undefined) {
            console.log(`Register interval ${interval}`);
            interval = setInterval(loadImageOnce, 100);
        }
    }

    async function loadImageOnce() {
        if (queue.length === 0) {
            console.log('queue is empty');
            clearInterval(interval);
            interval = undefined;
            return;
        }

        const file = queue.shift();
        file.imgSrc = await loadImage(file);
        imgSrc = file.imgSrc;
    }
</script>

<CardItem {onClick} {backgroundColor} {color} {title} {content} {imgSrc} />

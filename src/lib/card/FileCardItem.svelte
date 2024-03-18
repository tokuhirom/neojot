<script lang="ts">
    import { cachedLoadImage, type FileItem } from '../file_item/FileItem';
    import CardItem from './CardItem.svelte';
    import { onMount } from 'svelte';
    import { loadExcalidrawImage } from '../excalidraw/ExcalidrawUtils';
    import { selectedItemStore } from '../../Stores';

    export let file: FileItem;
    export let backgroundColor = '#f6f6f6';
    export let color = '#0f0f0f';

    function onClick() {
        $selectedItemStore = file;
    }

    let title: string | undefined;
    let content: string | undefined;
    let imgSrc: string | undefined;

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
            if (imgSrc === undefined) {
                console.error('Failed to load excalidraw image');
                title = '**Excalidraw image failed to load**';
            }
        } else {
            title = file.title;
            content = file.content
                .replace(/^(ALIAS|AUTOLINK):\s*.*?$/gms, '')
                .replace(/\[\[(.*?)]]/g, '$1')
                .split('\n')
                .slice(1)
                .join('\n');

            // content に markdown の画像記法が含まれていた場合は、それを読み取ります。
            // lazy loading...
            setTimeout(async () => {
                imgSrc = await cachedLoadImage(file);
            }, 0);
        }
    }
</script>

<CardItem {onClick} {backgroundColor} {color} {title} {content} {imgSrc} />

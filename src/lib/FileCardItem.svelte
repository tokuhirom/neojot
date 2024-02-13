<script lang="ts">
    import type { FileItem } from './FileItem';
    import CardItem from './CardItem.svelte';

    export let file: FileItem;
    export let onSelect: (fileItem: FileItem) => void;
    export let backgroundColor = '#f6f6f6';
    export let color = '#0f0f0f';

    function onClick() {
        onSelect(file);
    }
</script>

<CardItem
    {onClick}
    {backgroundColor}
    {color}
    title={file.title.replace(/TODO: /, '☐️').replace(/DONE: /, '☑')}
    content={file.content.split('\n').slice(1).join('\n')}
/>

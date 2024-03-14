<script lang="ts">
    import { getTaskIcon, type Task } from './Task';

    export let task: Task;

    $: icon = getTaskIcon(task);
</script>

<span>{icon}</span>

<script lang="ts">
    import type { Task } from './Task';
    import { startOfDay } from 'date-fns';

    export let task: Task;

    export function getTaskIcon(task: Task): string {
        const today = startOfDay(new Date());
        if (task.type === 'DONE') {
            return '✅';
        } else if (task.type === 'PLAN') {
            return '📅';
        } else if (task.type === 'DOING') {
            return '✍️';
        } else if (task.type === 'WAITING') {
            return '⏳';
        } else if (
            task.deadline &&
            task.deadline.getDate() <= today.getDate()
        ) {
            return '🚨';
        } else if (
            task.scheduled &&
            task.scheduled.getDate() === today.getDate()
        ) {
            return '💪';
        } else {
            return '📝';
        }
    }

    $: icon = getTaskIcon(task);
</script>

<span>{icon}</span>

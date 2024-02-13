import './styles.css';
import App from './App.svelte';

const target = document.getElementById('app');
if (!target) {
    alert('Missing target element');
}
const app = new App({
    target: target!,
});

export default app;

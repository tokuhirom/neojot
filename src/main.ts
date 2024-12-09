import './styles.css';
import App from './App.svelte';
import { mount } from "svelte";

const target = document.getElementById('app');
if (!target) {
    alert('Missing target element');
}
const app = mount(App, { target: target! });

export default app;

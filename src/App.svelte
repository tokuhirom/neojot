<script lang="ts">
  import CardView from "./lib/CardView.svelte";
  import ListView from "./lib/ListView.svelte";

  let tabPane = "list";
</script>

<main class="container">
  <div class="sidemenu">
    <button on:click={() => tabPane = "card"} class:active={tabPane === "card"}>🎴</button>
    <button on:click={() => tabPane = "list"} class:active={tabPane === "list"}>☀</button>
  </div>
  {#if tabPane==="list"}
    <ListView />
  {:else}
    <CardView />
  {/if}
</main>

<style>
  .container {
    display: flex; /* Enables Flexbox */
    flex-direction: row; /* Stack children vertically */
    height: 100vh;
    padding-left: 8px;
    padding-right: 8px;
  }

  .sidemenu {
    flex: 0 0 20px;
    padding-right: 9px;
    padding-left: 4px;
  }
  .sidemenu button.active {
    background-color: #646cff;
  }
  .sidemenu button {
    width: 40px;
    background-color: darkslategrey;
    color: inherit;
    border: none;
    padding: 8px;
    margin: 2px;
    font: inherit;
    cursor: pointer;
    border-bottom: darkslategrey 1px solid;
  }
</style>

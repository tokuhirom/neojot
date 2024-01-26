<script lang="ts">
  import {NodeRepository} from "./lib/repository/NodeRepository";
  import MessageItem from "./lib/MessageItem.svelte";
  import {onDestroy, onMount} from "svelte";
  import type {OutlineNode} from "./lib/OutlineNode";
  import {listen} from "@tauri-apps/api/event";

  let nodeRepository = new NodeRepository();
  let node: OutlineNode | null;
  let children: OutlineNode[] = [];

  onMount(async () => {
    node = await nodeRepository.load();
    children = node.children;
  });

  let unlistenSave = listen("save", async () => {
    if (node) {
      await nodeRepository.save(node);
      children = node.children;
    }
  });
  let unlistenRenderNodes = listen("render-nodes", () => {
    console.log("render-nodes");
    node = {...node};
    children = node?.children || [];
  });
  onDestroy(async () => {
    if (unlistenSave) {
      (await unlistenSave)();
    }
    if (unlistenRenderNodes) {
      (await unlistenRenderNodes)();
    }
  });
</script>

<main class="container">
  <div class="log-view">
    {#if node && children}
      {#each children as child}
        <MessageItem root={node} parent={node} node={child}
        />
      {/each}
    {/if}
  </div>
</main>

<style>
  .container {
    display: flex; /* Enables Flexbox */
    flex-direction: column; /* Stack children vertically */
    height: 100vh;
    padding-left: 8px;
    padding-right: 8px;
  }

  .log-view {
    padding-inline-start: 0;
    flex-grow: 1;
    margin-block-start: 0;
    margin-block-end: 0;
    max-height: 80vh;
  }
</style>

<script lang="ts">
  import {buildRootNode, NodeRepository} from "./lib/repository/NodeRepository";
  import MessageItem from "./lib/MessageItem.svelte";
  import {onDestroy, onMount} from "svelte";
  import type {OutlineNode} from "./lib/OutlineNode";
  import {listen} from "@tauri-apps/api/event";
  import {BaseDirectory, createDir, exists, type FileEntry, readDir, writeTextFile} from "@tauri-apps/api/fs";
  import FileListItem from "./lib/FileListItem.svelte";

  let nodeRepository = new NodeRepository();
  let rootNode: OutlineNode | null;
  let children: OutlineNode[] = [];

  let entries: FileEntry[];
  let selectedEntry: FileEntry | undefined;

  onMount(async () => {
    if (!await exists("data", {dir: BaseDirectory.AppData})) {
      await createDir("data", {dir: BaseDirectory.AppData});
    }

    // TODO: sort by file modified timestamp
    // but, tauri doesn't support it in fs module..
    entries = await readDir("data", {
      dir: BaseDirectory.AppData
    });

    if (entries.length == 0) {
      // 最初の1ファイルを作成する
      await nodeRepository.save("init.json", buildRootNode());
    }

    selectedEntry = entries[0];
    rootNode = await nodeRepository.load(selectedEntry.name!!);
    console.log(`Node ready: ${rootNode}`);
  });

  $: if (selectedEntry) {
    nodeRepository.load(selectedEntry.name!!).then((targetNode) => {
      rootNode = targetNode;
    });
  }
  $: if (rootNode) {
    children = rootNode.children;
  }

  onMount(async () => {
  });

  let unlistenSave = listen("save", async () => {
    if (rootNode) {
      await nodeRepository.save(selectedEntry!!.name!!, rootNode);
      children = rootNode.children;
    }
  });
  let unlistenRenderNodes = listen("render-nodes", () => {
    console.log("render-nodes");
    rootNode = rootNode;
    children = rootNode?.children || [];
  });
  onDestroy(async () => {
    if (unlistenSave) {
      (await unlistenSave)();
    }
    if (unlistenRenderNodes) {
      (await unlistenRenderNodes)();
    }
  });

  async function openEntry(fileEntry: FileEntry) {
    console.log(`open: ${fileEntry.path}`)
    selectedEntry = fileEntry;
    rootNode = await nodeRepository.load(fileEntry.name!!);
    children = rootNode.children;
  }
</script>

<main class="container">
  <div class="file-list">
    <!-- TODO: create new entry -->
    {#if entries && selectedEntry}
      {#each entries as entry}
        <FileListItem openEntry={openEntry} entry={entry} selectedEntry={selectedEntry} />
      {/each}
    {/if}
  </div>
  <div class="log-view">
    {#if rootNode && children}
      {#each children as child}
        <MessageItem root={rootNode} parent={rootNode} node={child} />
      {/each}
    {/if}
  </div>
</main>

<style>
  .container {
    display: flex; /* Enables Flexbox */
    flex-direction: row; /* Stack children vertically */
    height: 100vh;
    padding-left: 8px;
    padding-right: 8px;
  }

  .file-list {
    flex: 0 0 30%;
    overflow-y: auto;
    padding-right: 9px;
    padding-left: 4px;
    overflow-x: hidden;
    word-break: break-word;
    white-space: normal;
  }

  .log-view {
    padding-inline-start: 0;
    flex-grow: 1;
    margin-block-start: 0;
    margin-block-end: 0;
    max-height: 80vh;
  }
</style>

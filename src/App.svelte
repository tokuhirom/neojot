<script lang="ts">
  import {buildRootNode, NodeRepository} from "./lib/repository/NodeRepository";
  import MessageItem from "./lib/MessageItem.svelte";
  import {onDestroy, onMount} from "svelte";
  import {type OutlineNode, stringifyNode} from "./lib/OutlineNode";
  import {listen} from "@tauri-apps/api/event";
  import {BaseDirectory, createDir, exists, type FileEntry, readDir, writeTextFile} from "@tauri-apps/api/fs";
  import FileListItem from "./lib/FileListItem.svelte";

  let nodeRepository = new NodeRepository();
  let rootNode: OutlineNode | null;

  let entries: FileEntry[];
  let selectedEntry: FileEntry | undefined;

  async function loadFileList() {
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
  }

  onMount(async () => {
    await loadFileList();

    selectedEntry = entries[0];
    rootNode = await nodeRepository.load(selectedEntry.name!!);
    console.log(`Node ready: ${rootNode}`);
  });

  $: if (selectedEntry) {
    nodeRepository.load(selectedEntry.name!!).then((targetNode) => {
      rootNode = targetNode;
    });
  }

  listen("save", async () => {
    if (rootNode) {
      console.log(`SAVING: ${stringifyNode(rootNode)}`);
      await nodeRepository.save(selectedEntry!!.name!!, rootNode);
      rootNode = rootNode;
    }
  });
  listen("do_new_file", async () => {
    function getFormattedDate() {
      const now = new Date();

      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');

      return `${year}${month}${day}${hours}${minutes}${seconds}.json`;
    }

    const filename = getFormattedDate();
    console.log(`Added new file: ${filename}`)
    await nodeRepository.save(filename, buildRootNode());
    await loadFileList();
  })

  async function openEntry(fileEntry: FileEntry) {
    console.log(`open: ${fileEntry.path}`)
    selectedEntry = fileEntry;
    rootNode = await nodeRepository.load(fileEntry.name!!);
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
    {#if rootNode}
      {#each rootNode.children as child}
        <MessageItem root={rootNode} parent={rootNode} node={child} />
      {/each}
<!--      <pre>{stringifyNode(rootNode)}</pre>-->
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

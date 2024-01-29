<script lang="ts">
  import {buildRootNode, NodeRepository} from "./lib/repository/NodeRepository";
  import MessageItem from "./lib/MessageItem.svelte";
  import {onDestroy, onMount} from "svelte";
  import {type OutlineNode, stringifyNode} from "./lib/OutlineNode";
  import {listen} from "@tauri-apps/api/event";
  import {BaseDirectory, createDir, exists, type FileEntry, readDir, writeTextFile} from "@tauri-apps/api/fs";
  import FileListItem from "./lib/FileListItem.svelte";
  import {invoke} from "@tauri-apps/api";
  import type {FileItem} from "./lib/FileItem";

  let nodeRepository = new NodeRepository();
  let rootNode: OutlineNode | null;

  let fileItems: FileItem[];
  let selectedItem: FileItem | undefined;

  async function loadFileList() {
    if (!await exists("data", {dir: BaseDirectory.AppData})) {
      await createDir("data", {dir: BaseDirectory.AppData});
    }

    let newFileItems = await invoke('get_files') as FileItem[];

    console.log(newFileItems);

    fileItems = newFileItems;

    if (newFileItems.length == 0) {
      // 最初の1ファイルを作成する
      await nodeRepository.save("init.json", buildRootNode());

      console.log("Created init.json... so, i need to reload");
      await loadFileList();
    }
  }

  onMount(async () => {
    await loadFileList();

    selectedItem = fileItems[0];
    rootNode = await nodeRepository.load(selectedItem.name!!);
    console.log(`Node ready: ${rootNode}`);
  });

  $: if (selectedItem) {
    nodeRepository.load(selectedItem.name!!).then((targetNode) => {
      rootNode = targetNode;
    });
  }

  let unlistenSave = listen("save", async (event) => {
    let payload = event.payload as boolean;
    if (rootNode) {
      console.log(`SAVING: ${selectedItem!!.name!!}, ${stringifyNode(rootNode)} ${payload}`);
      await nodeRepository.save(selectedItem!!.name!!, rootNode);
      if (payload) {
        rootNode = rootNode;
      }
    }
  });
  let unlistenDoNewFile = listen("do_new_file", async () => {
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
  onDestroy(async () => {
    for (let unlisten of [unlistenSave, unlistenDoNewFile]) {
      (await unlisten)();
    }
  });

  async function openEntry(fileItem: FileItem) {
    console.log(`open: ${fileItem.name}`)
    selectedItem = fileItem;
    rootNode = await nodeRepository.load(fileItem.name);
  }
</script>

<main class="container">
  <div class="file-list">
    <!-- TODO: create new entry -->
    {#if fileItems && selectedItem}
      {#each fileItems as fileItem}
        <FileListItem openEntry={openEntry}
                      fileItem={fileItem}
                      selectedItem={selectedItem} />
      {/each}
    {/if}
  </div>
  <div class="log-view">
    {#if rootNode}
      {#each rootNode.children as child}
        <MessageItem root={rootNode} parent={rootNode} node={child} />
      {/each}
<!--      <pre>{JSON.stringify(rootNode, null, 4)}</pre>-->
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
    flex: 0 0 68%;
    /*overflow-x: hidden;*/
    padding-inline-start: 0;
    flex-grow: 1;
    margin-block-start: 0;
    margin-block-end: 0;
  }
</style>

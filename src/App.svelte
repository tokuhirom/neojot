<script lang="ts">
  import {NodeRepository} from "./lib/repository/NodeRepository";
  import {onDestroy, onMount} from "svelte";
  import {listen} from "@tauri-apps/api/event";
  import {BaseDirectory, createDir, exists} from "@tauri-apps/api/fs";
  import FileListItem from "./lib/FileListItem.svelte";
  import {invoke} from "@tauri-apps/api";
  import type {FileItem} from "./lib/FileItem";
  import EntryView from "./lib/EntryView.svelte";

  let nodeRepository = new NodeRepository();
  let md: string | null;

  let fileItems: FileItem[];
  let selectedItem: FileItem | undefined;

  async function loadFileList(retry: boolean) {
    if (!await exists("data", {dir: BaseDirectory.AppData})) {
      await createDir("data", {dir: BaseDirectory.AppData});
    }

    fileItems = await invoke('get_files') as FileItem[];

    if (fileItems.length == 0) {
      // 最初の1ファイルを作成する
      const newFileName = createNewFileName();
      await nodeRepository.save(newFileName, "");

      console.log(`Created new file ${newFileName}... so, i need to reload`);
      if (retry) {
        await loadFileList(false);
      }
    }
  }

  onMount(async () => {
    await loadFileList(true);

    selectedItem = fileItems[0];
    md = await nodeRepository.load(selectedItem.filename!!);
    console.log(`Node ready: ${md}`);
  });

  $: if (selectedItem) {
    nodeRepository.load(selectedItem.filename!!).then((targetNode) => {
      md = targetNode;
    });
  }
  function createNewFileName() {
    const now = new Date();

    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}.md`;
  }

  let unlistenDoNewFile = listen("do_new_file", async () => {
    const filename = createNewFileName();
    console.log(`Added new file: ${filename}`)
    await nodeRepository.save(filename, "");
    await loadFileList(true);
    selectedItem = fileItems[0];
  })
  onDestroy(async () => {
    for (let unlisten of [unlistenDoNewFile]) {
      (await unlisten)();
    }
  });

  async function openEntry(fileItem: FileItem) {
    console.log(`open: ${fileItem.filename}`)
    // reload content from file system
    fileItem.content = await nodeRepository.load(fileItem.filename);
    selectedItem = fileItem;
  }
</script>

<main class="container">
  <div class="file-list">
    {#if fileItems && selectedItem}
      {#each fileItems as fileItem}
        <FileListItem openEntry={openEntry}
                      fileItem={fileItem}
                      selectedItem={selectedItem} />
      {/each}
    {/if}
  </div>
  <div class="log-view">
    {#if md !== undefined}
      <EntryView nodeRepository={nodeRepository}
                 file={selectedItem}
                 fileItems={fileItems}
                 openEntry={openEntry} />
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

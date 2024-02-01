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
  let filteredFileItems: FileItem[];
  let selectedItem: FileItem | undefined;

  let searchWord = "";

  $: if (fileItems || searchWord) {
    filteredFileItems = fileItems.filter(it => shouldShowFileListItem(it));
  }

  async function loadFileList(retry: boolean) {
    if (!await exists("data", {dir: BaseDirectory.AppData})) {
      await createDir("data", {dir: BaseDirectory.AppData});
    }

    fileItems = await invoke('get_files') as FileItem[];

    if (fileItems.length == 0) {
      // 最初の1ファイルを作成する
      const newFileName = createNewFile();
      if (retry) {
        console.log(`Created new file ${newFileName}... so, i need to reload`);
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

  async function createNewFile(): Promise<string> {
    const filename = createNewFileName();
    console.log(`Adding new file: ${filename}`)
    await nodeRepository.save(filename, "# ");
    return filename;
  }

  let unlistenDoNewFile = listen("do_new_file", async () => {
    await createNewFile();
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

  function shouldShowFileListItem(fileItem: FileItem): boolean {
    if (searchWord.length == 0) {
      return true;
    }

    const lowerCaseSearchWord = searchWord.toLowerCase();
    const lowerCaseTitle = fileItem.title.toLowerCase();
    const lowerCaseContent = fileItem.content.toLowerCase();

    let words = lowerCaseSearchWord.split(/\s+/).filter(it => it.length>0);
    let result = true;
    for (let word of words) {
      if (!lowerCaseTitle.includes(word) && !lowerCaseContent.includes(word)) {
        result = false;
        break;
      }
    }
    return result;
  }
</script>

<main class="container">
  <div class="file-list">
    <input type="text" class="search-box" bind:value={searchWord} />
    {#if filteredFileItems && selectedItem}
      {#each filteredFileItems as fileItem}
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
  .search-box {
    width: 100%;
    font-size: 120%;
    display: block;
    margin-top: 9px;
    margin-bottom: 9px;
  }

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

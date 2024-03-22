import { type Writable, writable } from 'svelte/store';
import type { FileItem } from './lib/file_item/FileItem';
import type { Task } from './lib/task/Task';
import type { SearchResult } from './lib/file_item/Search';

export const dataFileItemsStore: Writable<FileItem[]> = writable([]);
export const searchKeywordStore: Writable<string> = writable('');
export const selectedItemStore: Writable<FileItem | undefined> =
    writable(undefined);
export const searchRegexesStore: Writable<RegExp[] | undefined> =
    writable(undefined);
export const tasksStore: Writable<Task[]> = writable([]);
export const searchFilteredFileItemsStore: Writable<SearchResult[]> = writable(
    [],
);

export const lowerTitle2fileItemStore: Writable<Record<string, FileItem>> =
    writable({});

export const openaiTokenStore: Writable<string | undefined> =
    writable(undefined);

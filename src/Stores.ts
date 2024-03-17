import { type Writable, writable } from 'svelte/store';
import type { FileItem } from './lib/file_item/FileItem';

export const dataFileItemsStore: Writable<FileItem[]> = writable([]);

import {BaseDirectory, createDir, exists, readTextFile, writeTextFile} from "@tauri-apps/api/fs";
import type {Message} from "../Message";

export class MessageRepository {
    async save(messages: Message[]) {
        const data = JSON.stringify(messages, null, 4);
        if (!await exists('', { dir: BaseDirectory.AppData })) {
            await createDir("", {dir: BaseDirectory.AppData});
        }

        await writeTextFile('messages.json',
            data,
            { dir: BaseDirectory.AppData });
    }

    async load() {
        const json = await readTextFile("messages.json", {
            dir: BaseDirectory.AppData
        });
        return JSON.parse(json) as Message[];
    }
}

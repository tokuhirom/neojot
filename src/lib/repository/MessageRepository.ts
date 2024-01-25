import {BaseDirectory, createDir, exists, readTextFile, writeTextFile} from "@tauri-apps/api/fs";
import type {Message} from "../Message";

export class MessageRepository {
    messages: Message[] = [];

    constructor() {
    }

    async save() {
        const data = JSON.stringify(this.messages, null, 4);
        if (!await exists('', { dir: BaseDirectory.AppData })) {
            await createDir("", {dir: BaseDirectory.AppData});
        }

        // TODO atomic write
        await writeTextFile('messages.json',
            data,
            { dir: BaseDirectory.AppData });
    }

    async load() {
        if (!await exists('messages.json', { dir: BaseDirectory.AppData })) {
            return [];
        }

        const json = await readTextFile("messages.json", {
            dir: BaseDirectory.AppData
        });
        this.messages = JSON.parse(json) as Message[];
    }

    async post(body: string) {
        let message: Message = {
            id: this.generateTimestampId(),
            createdSeconds: this.createdSeconds(),
            replies: [],
            body
        };
        this.messages.unshift(message);
        await this.save();
    }

    async reply(replyTo: Message, body: string) {
        let message: Message = {
            id: this.generateTimestampId(),
            createdSeconds: this.createdSeconds(),
            replies: [],
            body
        };
        replyTo.replies.push(message);
        await this.save();
    }


    createdSeconds() {
        return Math.floor(new Date().getTime() / 1000);
    }

    generateTimestampId() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hour = now.getHours().toString().padStart(2, '0');
        const minute = now.getMinutes().toString().padStart(2, '0');
        const second = now.getSeconds().toString().padStart(2, '0');
        const millis = now.getMilliseconds().toString().padStart(3, '0');

        return `${year}${month}${day}${hour}${minute}${second}${millis}`;
    }
}

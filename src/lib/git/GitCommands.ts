import { BaseDirectory, exists } from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';
import { message } from '@tauri-apps/plugin-dialog';

export async function initGit() {
    // Initialize a new git repository if there's no .git directory in the Application Support directory.
    if (!(await exists('.git', { baseDir: BaseDirectory.AppData }))) {
        try {
            await invoke('tauri_git_init');
        } catch (e) {
            console.error(e);
            await message(`Cannot do git operation: ${e}`, {
                title: 'Tauri',
                kind: 'error',
            });
        }
    }

    setInterval(
        async () => {
            try {
                await invoke('tauri_git_add_commit_push');
            } catch (e) {
                console.error(e);
                await message(`Cannot do git operation: ${e}`, {
                    title: 'Tauri',
                    kind: 'error',
                });
            }
        },
        10 * 60 * 1000,
    );
}

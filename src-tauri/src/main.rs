// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::time::SystemTime;
use serde::{Deserialize, Serialize};
use simplelog::ColorChoice;
use tauri::{AboutMetadata, CustomMenuItem, Menu, MenuItem, Submenu};


#[derive(Serialize, Deserialize)]
struct FileItem {
    name: String,
    mtime: u64,
}

#[tauri::command]
fn get_files() -> Result<Vec<FileItem>, String> {
    let datadir = dirs::data_dir().ok_or("Data directory not found")?;
    let data_path = datadir.join("com.github.tokuhirom.reflect-ai2/data");

    let mut file_items = Vec::new();

    if let Ok(entries) = fs::read_dir(data_path) {
        for entry in entries.filter_map(Result::ok) {
            let path = entry.path();
            if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("json") {
                let metadata = fs::metadata(&path)
                    .map_err(|e| format!("Failed to read file metadata: {}", e))?;

                let mtime = metadata.modified()
                    .map_err(|_| "Failed to get modification time".to_string())?
                    .duration_since(SystemTime::UNIX_EPOCH)
                    .map_err(|_| "Time conversion error".to_string())?
                    .as_secs();

                let filename = path.file_name()
                    .and_then(|s| s.to_str())
                    .ok_or("Failed to get filename".to_string())?
                    .to_string();

                file_items.push(FileItem { name: filename, mtime });
            }
        }
    }

    // mtime で降順にソート
    file_items.sort_by(|a, b| b.mtime.cmp(&a.mtime));

    Ok(file_items)
}

fn main() -> anyhow::Result<()> {
    let config = simplelog::ConfigBuilder::new()
        .set_time_offset_to_local()
        .expect("Cannot get timezone")
        .build();

    simplelog::CombinedLogger::init(vec![
        simplelog::TermLogger::new(
            simplelog::LevelFilter::Info,
            config.clone(),
            simplelog::TerminalMode::Mixed,
            ColorChoice::Auto
        ),
    ])?;


    let edit_menu = Menu::new()
        .add_native_item(MenuItem::Undo) // TODO implement by myself
        .add_native_item(MenuItem::Redo)
        .add_native_item(MenuItem::Separator)
        .add_native_item(MenuItem::Cut)
        .add_native_item(MenuItem::Copy)
        .add_native_item(MenuItem::Paste)
        .add_native_item(MenuItem::SelectAll);
    let file_menu = Submenu::new(
        "File",
        Menu::new()
            .add_item(CustomMenuItem::new("new_file", "New File")
                .accelerator("Command+n"))
    );

    let menu = Menu::new()
        .add_submenu(Submenu::new(
            "ReflectAI2",
            Menu::new()
                .add_native_item(MenuItem::About(
                    "ReflectAI2".to_string(),
                    AboutMetadata::default(),
                ))
                .add_native_item(MenuItem::Quit)
        ))
        .add_submenu(file_menu)
        .add_submenu(Submenu::new("Edit", edit_menu));


    tauri::Builder::default()
        .menu(menu)
        .on_menu_event(|event| {
            match event.menu_item_id() {
                "new_file" => {
                    log::info!("Create new entry");
                    if let Err(err) = event.window().emit("do_new_file", "DUMMY".to_string()) {
                        log::error!("Cannot emit message: {:?}", err);
                    }
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_files,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}

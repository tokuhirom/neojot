// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::time::SystemTime;
use serde::{Deserialize, Serialize};
use simplelog::ColorChoice;
use url::Url;
use regex::Regex;
use tauri::{App, Manager, Wry};
use tauri::menu::{Menu, MenuBuilder, MenuItemBuilder, SubmenuBuilder};


#[derive(Serialize, Deserialize)]
struct FileItem {
    filename: String,
    mtime: u64,
    title: String,
    content: String,
}

fn get_title(content: &str) -> String {
    let re = Regex::new(r"^#+\s+(.*)").unwrap(); // cache?

    return if let Some(captures) = re.captures(content) {
        captures.get(1).map_or_else(|| "", |m| m.as_str()).to_string()
    } else {
        // タイトルが見つからない場合は、最初の行を返す
        let mut lines = content.lines().clone();
        lines.next().unwrap_or("").to_string()
    };
}

#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    let valid_url = Url::parse(&url.clone())
        .map_err(|_| format!("Invalid URL: {}", url))?;

    // httpsかhttpで始まるかチェック
    match valid_url.scheme() {
        "http" | "https" => {
            open::that(url.clone())
                .map_err(|err| format!("Cannot open '{}': {:?}", url, err))
        },
        _ => Err(format!("URL must start with 'http://' or 'https://': {}", url))
    }
}

#[tauri::command]
fn load_file_item(filename: String) -> Result<FileItem, String> {
    let datadir = dirs::data_dir().ok_or("Data directory not found")?;
    let path = datadir.join("com.github.tokuhirom.neojot").join(filename.clone());

    let metadata = fs::metadata(&path)
        .map_err(|e| format!("Failed to read file metadata: {}", e))?;

    let mtime = metadata.modified()
        .map_err(|_| "Failed to get modification time".to_string())?
        .duration_since(SystemTime::UNIX_EPOCH)
        .map_err(|_| "Time conversion error".to_string())?
        .as_secs();

    match fs::read_to_string(&path) {
        Ok(content) => {
            let title = get_title(content.as_str());

            Ok(FileItem {
                filename,
                mtime,
                content,
                title: title.to_string()
            })
        }
        Err(err) => {
            log::warn!("Cannot load {}: {:?}", filename, err);
            Err(format!("Cannot load {}: {:?}", filename, err))
        }
    }
}

#[tauri::command]
fn get_files(prefix: String) -> Result<Vec<FileItem>, String> {
    log::info!("get_files: {}", prefix);
    let datadir = dirs::data_dir().ok_or("Data directory not found")?;
    let data_path = datadir.join("com.github.tokuhirom.neojot").join(prefix.clone());

    let mut file_items = Vec::new();

    if let Ok(entries) = fs::read_dir(data_path) {
        for entry in entries.filter_map(Result::ok) {
            // log::info!("entry: {:?}", entry);
            let path = entry.path();
            if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("md") {
                let filename = path.file_name()
                    .and_then(|s| s.to_str())
                    .ok_or("Failed to get filename".to_string())?
                    .to_string();

                match load_file_item(format!("{}/{}", prefix, filename)) {
                    Ok(file_item) => {
                        file_items.push(file_item);
                    }
                    Err(err) => {
                        log::warn!("Cannot load {}: {:?}", filename, err);
                    }
                }
            }
        }
    }

    // mtime で降順にソート
    file_items.sort_by(|a, b| b.mtime.cmp(&a.mtime));

    Ok(file_items)
}

fn build_menu(app: &App) -> tauri::Result<Menu<Wry>> {
    let file_menu = SubmenuBuilder::new(app, "File")
        .item(
            &MenuItemBuilder::new("New File")
                .id("new_file")
                .accelerator("Command+n")
                .build(app)?
        )
        .item(
            &MenuItemBuilder::new("Archive")
                .id("archive")
                .accelerator("Command+d")
                .build(app)?,
        )
        .build()?;

    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .separator()
        .select_all()
        .build()?;

    /*
        let edit_menu = Menu::new()
        .add_native_item(MenuItem::Undo) // TODO implement by myself
        .add_native_item(MenuItem::Redo)
        .add_native_item(MenuItem::Separator)
        .add_native_item(MenuItem::Cut)
        .add_native_item(MenuItem::Copy)
        .add_native_item(MenuItem::Paste)
        .add_native_item(MenuItem::SelectAll);

     */
    let view_menu = SubmenuBuilder::new(app, "View")
        .item(
            &MenuItemBuilder::new("Card View")
                .id("card_view")
                .accelerator("Command+1")
                .build(app)?
        )
        .item(
            &MenuItemBuilder::new("List View")
                .id("list_view")
                .accelerator("Command+2")
                .build(app)?
        )
        .item(
            &MenuItemBuilder::new("Task View")
                .id("task_view")
                .accelerator("Command+3")
                .build(app)?
        )
        .item(
            &MenuItemBuilder::new("Calendar View")
                .id("calendar_view")
                .accelerator("Command+4")
                .build(app)?
        )
        .item(
            &MenuItemBuilder::new("Archive View")
                .id("archive_view")
                .accelerator("Command+5")
                .build(app)?
        ).build()?;

    let menu = MenuBuilder::new(app)
        .items(&[&file_menu, &edit_menu, &view_menu])
        .build()?;

    Ok(menu)
}

fn main() -> anyhow::Result<()> {
    println!("Booting...");
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

    println!("Ready to start");

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let menu = build_menu(app)?;
            app.set_menu(menu)?;
            app.on_menu_event(move |app, event| {
                let action_name = format!("do_{}", event.id().0);
                if let Err(err) = app.emit(&action_name, "DUMMY".to_string()) {
                    log::error!("Cannot emit message for action '{}': {:?}", action_name, err);
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_files,
            open_url,
            load_file_item,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}

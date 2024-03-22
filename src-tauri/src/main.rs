// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;
use std::fs;
use std::fs::File;
use std::io::Write;
use std::time::SystemTime;

use anyhow::anyhow;
use dirs::config_dir;
use simplelog::ColorChoice;
use tauri::{App, Manager, Wry};
use tauri::menu::{Menu, MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::path::BaseDirectory::AppData;
use tauri_plugin_autostart::MacosLauncher;
use url::Url;

use crate::file_item::{FileItem, get_title};
use crate::git::{get_commits_by_day, git_init};
use crate::git::git_add_commit_push;

mod git;
pub mod file_item;
mod openai;

#[tauri::command]
fn tauri_git_init() -> Result<(), String> {
    git_init()
        .map_err(|e| format!("Failed to initialize repository: {}", e))?;
    Ok(())
}

#[tauri::command]
fn tauri_git_add_commit_push() -> Result<(), String> {
    git_add_commit_push()
        .map_err(|e| format!("Failed to operate repository: {}", e))?;
    Ok(())
}

#[tauri::command]
fn tauri_get_commits_by_day(year: i32, month: u32) -> Result<HashMap<u32, Vec<String>>, String> {
    return get_commits_by_day(year, month)
        .map_err(|e| format!("Failed to operate repository: {}", e));
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
fn tauri_get_title_markdown(content: String) -> String {
    file_item::get_title_markdown(content.as_str())
}

#[tauri::command]
fn load_file_item(filename: String) -> Result<FileItem, String> {
    let datadir = dirs::data_dir().ok_or("Data directory not found")?;
    let path = datadir.join("com.github.tokuhirom.neojot").join(filename.clone());

    let metadata = fs::metadata(&path.clone())
        .map_err(|e| format!("Failed to read file metadata: {}", e))?;

    let mtime = metadata.modified()
        .map_err(|_| "Failed to get modification time".to_string())?
        .duration_since(SystemTime::UNIX_EPOCH)
        .map_err(|_| "Time conversion error".to_string())?
        .as_secs();

    match fs::read_to_string(&path) {
        Ok(content) => {
            let title = get_title(path, content.as_str());

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
fn tauri_ask_openai(openai_token: String, prompt: String, note: String) -> Result<(), String> {
    openai::ask_openai(openai_token, prompt, note)
        .map_err(|e| format!("Failed to ask OpenAI: {}", e))?;
    Ok(())
}

#[tauri::command]
fn get_openai_token() -> Result<String, String> {
    let config_dir = dirs::config_dir().ok_or("Config directory not found")?;
    let path = config_dir.join("com.github.tokuhirom.neojot").join("openai_token.txt");
    let result = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read the token from the file: {}", e))?;
    Ok(result)
}

#[tauri::command]
fn set_openai_token(openai_token: String) -> Result<(), String> {
    let config_dir = dirs::config_dir().ok_or("Config directory not found")?;
    let path = config_dir.join("com.github.tokuhirom.neojot").join("openai_token.txt");

    let mut file = match File::create(&path) {
        Ok(file) => file,
        Err(e) => return Err(format!("Failed to create/open the file: {}", e)),
    };

    log::info!("Write to {:?}", path);
    // トークンをファイルに書き込む
    match file.write_all(openai_token.as_bytes()) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to write the token to the file: {}", e)),
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
            let ext = path.extension().and_then(|s| s.to_str());
            if path.is_file() && (ext == Some("md") || ext == Some("excalidraw")) {
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
    let app_menu = SubmenuBuilder::new(app, "App")
        .build()?;
    let file_menu = SubmenuBuilder::new(app, "File")
        .item(
            &MenuItemBuilder::new("New File")
                .id("new_file")
                .accelerator("Command+n")
                .build(app)?
        )
        .item(
            &MenuItemBuilder::new("New Excalidraw")
                .id("new_excalidraw")
                .build(app)?
        )
        .item(
            &MenuItemBuilder::new("Archive")
                .id("archive")
                .accelerator("command+d")
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
        .items(&[&app_menu, &file_menu, &edit_menu, &view_menu])
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
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))
        .setup(|app| {
            let menu = build_menu(app)?;
            app.set_menu(menu)?;
            app.on_menu_event(move |app, event| {
                if event.id().0 == "new_excalidraw" {
                    match create_new_excalidraw() {
                        Ok(fname) => {
                            log::info!("New Excalidraw created");
                            if let Err(err) = app.emit("do_new_excalidraw", fname) {
                                log::error!("Cannot emit message for action 'do_new_excalidraw': {:?}", err);
                            }
                        },
                        Err(err) => log::error!("Failed to create new Excalidraw: {:?}", err)
                    }
                } else {
                    let action_name = format!("do_{}", event.id().0);
                    log::info!("Forwarding menu item: {:?}", action_name);
                    if let Err(err) = app.emit(&action_name, "DUMMY".to_string()) {
                        log::error!("Cannot emit message for action '{}': {:?}", action_name, err);
                    }
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_files,
            open_url,
            load_file_item,
            tauri_git_init,
            tauri_git_add_commit_push,
            tauri_get_commits_by_day,
            tauri_get_title_markdown,
            tauri_ask_openai,
            get_openai_token,
            set_openai_token,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}

fn create_new_excalidraw() -> anyhow::Result<String> {
    // Create `data/yyyyMMddHHmmss.excalidraw`.
    let now = chrono::Local::now();
    let filename = format!("data/{}.excalidraw", now.format("%Y%m%d%H%M%S"));
    let datadir = dirs::data_dir().ok_or(anyhow!("Data directory not found"))?;
    let path = datadir.join("com.github.tokuhirom.neojot").join(filename.clone());

    // write the dummy content
    let content = include_str!("../assets/excalidraw");
    fs::write(&path, content)?;
    Ok(filename)
}

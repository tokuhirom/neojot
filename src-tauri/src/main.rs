// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use simplelog::ColorChoice;
use tauri::{AboutMetadata, CustomMenuItem, Menu, MenuItem, Submenu};

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
            // TODO handlers
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}

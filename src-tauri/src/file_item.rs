use std::path::PathBuf;

use regex::Regex;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct FileItem {
    pub(crate) filename: String,
    pub(crate) mtime: u64,
    pub(crate) title: String,
    pub(crate) content: String,
}

pub fn get_title(path: PathBuf, content: &str) -> String {
    if path.to_str().unwrap().ends_with(".excalidraw") {
        log::info!("excalidraw: {:?}", path);
        // get basename without extension
        let basename = path.file_stem().and_then(|s| s.to_str()).unwrap_or("");

        // read file as JSON and get title from it
        // title is in "neojot:title" field.
        let json: serde_json::Value = serde_json::from_str(content).unwrap();
        return if let Some(title) = json.get("neojot:title") {
            title.as_str().unwrap().to_string()
        } else {
            let basename = basename.trim_end_matches(".excalidraw");
            format!("Draw {}", basename)
        };
    }

    get_title_markdown(content)
}

pub fn get_title_markdown(content: &str) -> String {
    if let Some(first_line) = content.lines().next() {
        if let Some(stripped) = first_line.strip_prefix("# ") {
            let title = stripped.trim();
            // タイトルが空白文字でないことを確認
            if !title.is_empty() {
                return title.to_owned();
            }
        }
    }

    // Markdownタイトルがない場合は、TODO記法をチェック
    let todo_regex = Regex::new(r"^(TODO|DOING|PLAN|DONE|CANCELED)\[.*\]:\s*").unwrap();
    for line in content.lines().skip(1) {
        if line.is_empty() {
            continue;
        }

        // TODO記法があればそれを取り除く
        if todo_regex.is_match(line) {
            return todo_regex.replace(line, "").to_string().trim().to_owned();
        }

        // TODO記法がなければその行をそのまま返す
        return line.trim().to_owned();
    }

    // タイトルが見つからない場合
    "NO TITLE".to_owned()
}

#[cfg(test)]
mod tests {
    use crate::file_item::get_title_markdown;

    #[test]
    fn it_works() {
        assert_eq!(get_title_markdown("# hello"), String::from("hello"));
        assert_eq!(get_title_markdown("# hello world"), String::from("hello world"));
        assert_eq!(get_title_markdown("# \nhello"), String::from("hello"));
        assert_eq!(get_title_markdown("# \nTODO[Scheduled: 2024-01-03(Mon)]: hello"), String::from("hello"));
    }
}


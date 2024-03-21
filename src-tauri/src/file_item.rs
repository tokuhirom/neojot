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
        }
    }

    return get_title_markdown(content);
}

pub fn get_title_markdown(content: &str) -> String {
    let re = Regex::new(r"^#+ *([^\n ]+)").unwrap(); // cache?

    return if let Some(captures) = re.captures(content) {
        println!("GO: {:?}", captures.get(1));
        captures.get(1).map_or_else(|| "", |m| m.as_str()).to_string()
    } else {
        // タイトルが見つからない場合は、最初の空白行でない行を返す。
        // ただし、TODO 記法の場合は TODO 記法の部分を削除して返す。
        // /^(TODO|DOING|PLAN|DONE|CANCELED)\[.*]:\s*/ にマッチした場合マッチした部分を消す。
        let lines = content.lines().clone().skip(1);
        for line in lines {
            if line.is_empty() {
                continue;
            }

            log::info!("title?: {}", line);
            return if line.starts_with("TODO[") || line.starts_with("DOING[") || line.starts_with("PLAN[") || line.starts_with("DONE[") || line.starts_with("CANCELED[") {
                let re = Regex::new(r"^(TODO|DOING|PLAN|DONE|CANCELED)\[.*\]:\s*").unwrap();
                re.replace(line, "").to_string()
            } else {
                line.to_string()
            }
        }
        return String::from("NO TITLE");
    };
}

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert_eq!(crate::get_title_markdown("# hello"), String::from("hello"));
        assert_eq!(crate::get_title_markdown("# \nhello"), String::from("hello"));
        assert_eq!(crate::get_title_markdown("# \nTODO[Scheduled: 2024-01-03(Mon)]: hello"), String::from("hello"));
    }
}


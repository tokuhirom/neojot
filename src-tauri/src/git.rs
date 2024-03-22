use std::collections::HashMap;
use std::path::PathBuf;
use anyhow::anyhow;
use git2::{IndexAddOption, Repository, Signature, Time};
use chrono::Datelike;

fn push_changes(repo: &Repository) -> anyhow::Result<()> {
    let remotes = repo.remotes()?;
    for remote in &remotes {
        log::info!("Remote: {:?}", remote);
        if let Some(remote) = remote {
            repo.find_remote(remote)?
                .push(&["refs/heads/main:refs/heads/main"], None)?;
        }
    }
    Ok(())
}

fn find_last_commit(repo: &Repository) -> Result<Option<git2::Oid>, git2::Error> {
    match repo.head() {
        Ok(head) => {
            let head = head.resolve()?;
            let commit = head.peel(git2::ObjectType::Commit)?.into_commit().map_err(|_| git2::Error::from_str("Couldn't find commit"))?;
            Ok(Some(commit.id()))
        },
        Err(_) => {
            Ok(None) // HEADが存在しない場合（コミットがない場合）は、Noneを返します。
        },
    }
}


fn get_data_dir() -> anyhow::Result<PathBuf> {
    let datadir = dirs::data_dir().ok_or(anyhow!("Data directory not found"))?;
    Ok(datadir.join("com.github.tokuhirom.neojot"))
}

pub fn git_init() -> anyhow::Result<()> {
    let path = get_data_dir()?;

    let _ = Repository::init(&path)?;
    log::info!("Repository initialized at {:?}", path);
    Ok(())
}

pub fn git_add_commit_push() -> anyhow::Result<()> {
    let path = get_data_dir()?;
    log::info!("Running git_add_commit_push");

    // 'git add .' by git2
    let repo = Repository::open(path)?;
    let mut index = repo.index()?;
    index.add_all(["*"].iter(), IndexAddOption::DEFAULT, None)?;
    index.write()?;

    let oid = index.write_tree()?;
    let tree = repo.find_tree(oid)?;
    let diff = if let Some(oid) = find_last_commit(&repo)? {
        let parent = repo.find_commit(oid)?;
        let parent_tree = parent.tree()?;
        repo.diff_tree_to_tree(Some(&parent_tree), Some(&tree), None)?
    } else {
        // 最初のコミットの場合は、常に差分があると見なします。
        repo.diff_tree_to_tree(None, Some(&tree), None)?
    };

    // if there's any change, commit it.
    if diff.deltas().count() > 0 {
        log::info!("Committing changes");
        let oid = index.write_tree()?;
        let tree = repo.find_tree(oid)?;

        let signature=  repo.signature()
            .or_else(|_| Signature::now("Author Name", "author@example.com"))?;

        let parent_commit_id = find_last_commit(&repo)?;
        if let Some(oid) = parent_commit_id {
            repo.commit(Some("HEAD"), &signature, &signature, "auto commit", &tree,
                        &[&repo.find_commit(oid)?])
                .map_err(|e| anyhow!("Failed to commit: {}", e))?;
        } else {
            repo.commit(Some("HEAD"), &signature, &signature, "auto commit", &tree,
                        &[])
                .map_err(|e| anyhow!("Failed to commit: {}", e))?;
        }

        // リモートが設定されていればプッシュ（この部分は実装が必要）
        let remotes = repo.remotes()?;
        if !remotes.is_empty() {
            log::info!("[git] Pushing changes");
            push_changes(&repo)?;
        } else {
            log::info!("[git] No remotes configured, skipping push");
        }
    } else {
        log::info!("No changes in the repository. Skipping commit and push.")
    }

    Ok(())
}

pub fn get_commits_by_day(year: i32, month: u32) -> anyhow::Result<HashMap<u32, Vec<String>>> {
    let path = get_data_dir()?;
    log::info!("Running get_commits_by_day for {}-{} in {:?}", year, month, path);
    let repo = Repository::open(path)?;

    let mut result: HashMap<u32, Vec<String>> = HashMap::new();
    let mut revwalk = repo.revwalk()?;
    revwalk.push_head()?;

    for oid in revwalk {
        let commit = repo.find_commit(oid?)?;
        let commit_time = Time::new(commit.time().seconds(), 0);
        let Some(commit_datetime) = chrono::DateTime::from_timestamp(commit_time.seconds(), 0) else {
            log::warn!("Failed to convert commit time to NaiveDateTime: {:?}", commit_time);
            continue;
        };
        let commit_date = commit_datetime.date_naive();

        // 指定された年と月にフィルタリング
        if commit_date.year() == year && commit_date.month() == month {
            let day = commit_date.day();
            let mut filenames = vec![];

            // コミット内の変更を取得
            if let Ok(parent) = commit.parent(0) {
                let diff = repo.diff_tree_to_tree(Some(&parent.tree()?), Some(&commit.tree()?), None)?;

                diff.foreach(&mut |delta, _| {
                    if let Some(file) = delta.new_file().path() {
                        if file.extension() == Some(std::ffi::OsStr::new("md")) {
                            if let Some(name) = file.file_name().and_then(|name| name.to_str()) {
                                filenames.push(String::from(name));
                            }
                        }
                    }
                    true
                }, None, None, None)?;
            }

            // 重複を除去してMapに追加
            filenames.sort();
            filenames.dedup();
            result.entry(day).or_default().extend(filenames);
        }
    }

    Ok(result)
}

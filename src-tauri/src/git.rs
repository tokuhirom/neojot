use std::path::PathBuf;
use anyhow::anyhow;
use git2::{IndexAddOption, Repository, Signature};

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

    // if there's any change, commit it.
    if index.iter().count() > 0 {
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
        if remotes.len() > 0 {
            log::info!("[git] Pushing changes");
            push_changes(&repo)?;
        } else {
            log::info!("[git] No remotes configured, skipping push");
        }
    }

    Ok(())
}

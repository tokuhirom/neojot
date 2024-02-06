# tauri 2 移行メモ

tauri 2beta が出たので移行する。

```shell
npm install @tauri-apps/cli@next
npm run tauri migrate
```

とすると、自動的にある程度マイグレーションしてくれる。

`src/main.rs` を `src/lib.rs` に移動するのが一見必要そうだが、一旦やらなくても良さそう。

API が結構変わっているので、対応必要。このへんは自動ではマイグレーションしてくれない様子。

## fs まわり

```toml
[dependencies]
tauri-plugin-fs = "2.0.0-beta.0"
```

というふうに依存追加。

↓のようにして有効化。 `src-tauri/src/main.rs`:

```rust
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
}
```

- renameFile removed and replaced with rename.
- removeFile removed and replaced with remove.

といったように、メソッド名が変わったりしている。

また、dir オプションが全般的に baseDir に変わったみたい。
rename が newPathBaseDir と oldPathBaseDir に別れたの最高っぽい。

migration すると以下のような内容が src-tauri/capabilities/migrated.json に allowlist の内容が migrate される。
しかし、このままではぶっ壊れている。例えば、 `"fs:allow-read-file"` という permission は消えたので、`Permission fs:allow-read-file not found, expected one of app:default, app:allow-app-hide, ...` というような
エラーになる。

## メニューが便利

Menu が rust ではなく JS 側でできるっぽいがドキュメントがまだなさそう。

module.exports = {
    env: {
        browser: true,
    },
    parser: '@typescript-eslint/parser', // TypeScriptのパーサーを指定
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json', // TypeScriptの設定ファイルへのパス
        extraFileExtensions: ['.svelte'],
    },
    plugins: ['@typescript-eslint', "prettier"], // 使用するプラグイン
    extends: [
        'eslint:recommended', // ESLintの推奨ルール
        'plugin:svelte/recommended',
        "prettier",
        'plugin:@typescript-eslint/recommended', // TypeScript推奨ルール
    ],
    overrides: [
        {
            files: ['*.svelte'],
            parser: 'svelte-eslint-parser',
            // Parse the `<script>` in `.svelte` as TypeScript by adding the following configuration.
            parserOptions: {
                parser: '@typescript-eslint/parser'
            }
        },
    ],
    settings: {
        // Svelteプラグインの設定
        'svelte3/typescript': () => require('typescript'),
    },
    rules: {
        "prettier/prettier": "error",
        // カスタムルール (プロジェクトのニーズに応じて調整)
    },
};

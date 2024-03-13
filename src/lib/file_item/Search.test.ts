import { expect, test, describe } from 'vitest';
import { searchFileItems } from './Search';
import type { FileItem } from './FileItem';

describe('searchFileItems', () => {
    test('returns all file items with empty lines for empty search word', () => {
        const fileItems: FileItem[] = [
            {
                title: 'Document',
                content: 'This is a test document.',
                mtime: 0,
                filename: 'doc.md',
            },
        ];
        const results = searchFileItems(fileItems, '', []);
        expect(results).toHaveLength(fileItems.length);
        results.forEach((result) => {
            expect(result.lines).toEqual([]);
        });
    });

    // TODO: Excalidrawファイルのテスト

    // Markdownファイルのテスト
    test('finds lines in markdown files excluding specific patterns', () => {
        const fileItems: FileItem[] = [
            {
                title: 'hello',
                content: '# hello',
                mtime: 0,
                filename: 'doc.md',
            },
            {
                title: 'test',
                content: '# test\nhello',
                mtime: 0,
                filename: 'doc2.md',
            },
            {
                title: 'foobar',
                content: '# foobar',
                mtime: 0,
                filename: 'unmatch.md',
            },
        ];
        const regExps = [new RegExp('hello', 'i')];
        const results = searchFileItems(fileItems, 'hello', regExps);
        expect(results.map((it) => it.fileItem.filename)).toStrictEqual([
            'doc.md',
            'doc2.md',
        ]);
    });
});

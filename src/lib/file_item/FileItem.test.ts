import { describe, expect, test } from 'vitest';
import {
    extractBrackets,
    extractBracketsWithCache,
    extractTitle,
} from './FileItem';

test('extractBrackets', () => {
    const links = extractBrackets('HAHAHA [[hoge]] [[fuga]]');
    expect(links).toStrictEqual(['hoge', 'fuga']);
});

test('extractBracketsWithCache', () => {
    const links2 = extractBracketsWithCache({
        filename: 'foobar.md',
        title: 'foobar',
        content: 'HAHAHA [[hoge]] [[fuga]]',
        mtime: 0,
    });
    expect(links2).toStrictEqual(['hoge', 'fuga']);

    const links3 = extractBracketsWithCache({
        filename: 'foobar.md',
        title: 'foobar',
        content: 'HAHAHA [[piyo]] [[poyo]]',
        mtime: 1,
    });
    expect(links3).toStrictEqual(['piyo', 'poyo']);
    // cache invalidate by mtime
});

describe('extractTitle', () => {
    test('simple', () => {
        const title = extractTitle('# hoge');
        expect(title).toEqual('hoge');
    });

    test('second line', () => {
        const title = extractTitle('# \n\nhoge');
        expect(title).toEqual('hoge');
    });
});

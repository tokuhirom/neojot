import { describe, it, expect, beforeAll, vi } from 'vitest';
import { makeMigemoRegexes } from './Migemo'; // 適切なパスに修正してください
import fs from 'fs';
import path from 'path';

// fetch をモック化
vi.stubGlobal('fetch', vi.fn());

describe('makeMigemoRegexes tests', () => {
    beforeAll(() => {
        // fetch のモックを設定
        global.fetch.mockImplementation((url: string) => {
            console.log(`MOCKING ${url}`);
            if (url === '/assets/yet-another-migemo-dict/migemo-compact-dict') {
                // ここでローカルのテスト用辞書を読み込む
                const dictPath = path.resolve(
                    __dirname,
                    '../../../public/assets/yet-another-migemo-dict/migemo-compact-dict',
                );
                const buffer = fs.readFileSync(dictPath);
                const dictionaryData = buffer.buffer.slice(
                    buffer.byteOffset,
                    buffer.byteOffset + buffer.byteLength,
                );
                return Promise.resolve({
                    ok: true,
                    arrayBuffer: () => Promise.resolve(dictionaryData),
                });
            }
            return Promise.reject(new Error('File not found'));
        });
    });

    it('should return an array of regexes for non-empty search word', async () => {
        const regexes = await makeMigemoRegexes('test word');
        expect(regexes).toBeInstanceOf(Array);
        expect(regexes.length).toBeGreaterThan(0);
        regexes.forEach((re) => expect(re).toBeInstanceOf(RegExp));
        expect(regexes).toStrictEqual([
            /(?:test|てs[たちっつてと]|テs[タチッツテト]|ｔｅｓｔ|ﾃs[ｯﾀﾁﾂﾃﾄ])/,
            /(?:word|をr[だぢっづでど]|ヲr[ダヂッヅデド]|ｗｏｒｄ|ｦr(?:ｯ|ﾀﾞ|ﾁﾞ|ﾂﾞ|ﾃﾞ|ﾄﾞ))/,
        ]);
    });

    it('trailing space', async () => {
        const regexes = await makeMigemoRegexes('take ');
        expect(regexes).toBeInstanceOf(Array);
        expect(regexes.length).toBeGreaterThan(0);
        regexes.forEach((re) => expect(re).toBeInstanceOf(RegExp));
        expect(regexes).toStrictEqual([
            /(?:[丈健剛哮壮壯威孟尊岳峯崇崚嵩嶽建彪斌武毅炬猛竹笋筍英茸蕈豪赳酣長闌雄顕驍高]|take|たけ|タケ|他[家形犬県見計]|全夫|多(?:[型形慶景血見]|惠子|毛留|計志)|太圭智|宝雄|春笋|桓夫|梟[帥師]|神武|赴夫|鮮笋|ｔａｋｅ|ﾀｹ)/,
        ]);
    });

    it('should return an empty array for an empty search word', async () => {
        const regexes = await makeMigemoRegexes('');
        expect(regexes).toEqual([]);
    });
});

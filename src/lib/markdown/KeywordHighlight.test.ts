import { expect, test } from 'vitest';
import { buildKeywordRegex } from './KeywordHighlight';

test('buildKeywordRegex', () => {
    const keywordRegex = buildKeywordRegex(['jetbrains']);
    const p =
        'https://www.jetbrains.com/help/idea/tutorial-work-with-structural-search-and-replace.html'.replace(
            keywordRegex,
            'hello',
        );
    expect(p).toStrictEqual(
        'https://www.jetbrains.com/help/idea/tutorial-work-with-structural-search-and-replace.html',
    );
});

import { describe, it, expect } from 'vitest';
import { extractCardContent } from './CardUtils';

describe('extractCardContent', () => {
    it('removes metadata like ALIAS and AUTOLINK', () => {
        const content = `Some intro text\nALIAS: ExampleAlias\nAUTOLINK: ExampleLink\nValid content line`;
        const expected = `Valid content line`;
        expect(extractCardContent(content)).toBe(expected);
    });

    it('keeps the text inside [[...]] link notation', () => {
        const content = `Some intro text\n[[Link Text]]\nSome outro text`;
        const expected = `Link Text\nSome outro text`;
        expect(extractCardContent(content)).toBe(expected);
    });

    it('removes image notation', () => {
        const content = `Some intro text\n![Image Description](image-url)\nSome outro text`;
        const expected = `Some outro text`;
        expect(extractCardContent(content)).toBe(expected);
    });

    it('removes http links', () => {
        const content = `Some intro text\nhttp://example.com\nSome outro text`;
        const expected = `Some outro text`;
        expect(extractCardContent(content)).toBe(expected);
    });

    it('applies all rules in a complex scenario', () => {
        const content = `ALIAS: ExampleAlias\nSome intro text\n[[Link Text]]\n![Image Description](image-url)\nhttp://example.com\nAUTOLINK: ExampleLink\nSome outro text`;
        const expected = `Link Text\nSome outro text`;
        expect(extractCardContent(content)).toBe(expected);
    });
});

import { describe, expect, test } from 'vitest';
import { buildLinks, extractLinks, type Links } from './Links';
import type { FileItem } from '../file_item/FileItem';

// for debugging
function dumpLinks(links: Links) {
    console.log('LINKS: ' + links.links.map((it) => it.title).join(', '));
    console.log('TWOHOP:');
    links.twoHopLinks.forEach((it) => {
        console.log(
            `  ${it.src.title}: ${it.dst.map((it) => (it ? it.title : '-')).join(', ')}`,
        );
    });
    console.log(`newLinks: ${links.newLinks.join(', ')}`);
}

describe('Basic Links Test', () => {
    const orig = {
        title: 'orig',
        content: `[[foo]] [[bar]] [[goo]] [[miso]] [[soup]] [[jot]] [[orig]]`,
        mtime: 0,
        filename: 'orig.md',
    };
    const foo = {
        title: 'foo',
        content: ``,
        mtime: 0,
        filename: 'foo.md',
    };
    const bar = {
        title: 'bar',
        content: `[[boz]]`,
        mtime: 0,
        filename: 'bar.md',
    };
    const boo = {
        title: 'boo',
        content: `[[orig]]`,
        mtime: 0,
        filename: 'boo.md',
    };
    const boz = {
        title: 'boz',
        content: ``,
        mtime: 0,
        filename: 'boz.md',
    };
    const miso = {
        title: 'miso',
        content: `[[soup]]`,
        mtime: 0,
        filename: 'miso.md',
    };
    const soup = {
        title: 'soup',
        content: ``,
        mtime: 0,
        filename: 'soup.md',
    };
    const jot = {
        title: 'jot',
        content: ``,
        mtime: 0,
        filename: 'jot.md',
    };
    const jotmisc = {
        title: 'jotmisc',
        content: `[[jot]]`,
        mtime: 0,
        filename: 'jotmisc.md',
    };
    const fileItems: FileItem[] = [
        orig,
        foo,
        bar,
        boo,
        boz,
        miso,
        soup,
        jot,
        jotmisc,
    ];

    test('extractLinks', () => {
        const { forward, backward } = extractLinks(fileItems);
        expect(forward).toStrictEqual(
            new Map()
                .set('orig', ['foo', 'bar', 'goo', 'miso', 'soup', 'jot'])
                .set('bar', ['boz'])
                .set('boo', ['orig'])
                .set('miso', ['soup'])
                .set('jotmisc', ['jot']),
        );
        expect(backward).toStrictEqual(
            new Map()
                .set('foo', ['orig'])
                .set('bar', ['orig'])
                .set('boz', ['bar'])
                .set('orig', ['boo'])
                .set('goo', ['orig'])
                .set('miso', ['orig'])
                .set('soup', ['orig', 'miso'])
                .set('jot', ['orig', 'jotmisc']),
        );
    });

    test('buildLinks', () => {
        const lowerTitle2fileItem: Record<string, FileItem> = {};
        fileItems.forEach(
            (it) => (lowerTitle2fileItem[it.title.toLowerCase()] = it),
        );
        const links = buildLinks(orig, lowerTitle2fileItem, fileItems);

        dumpLinks(links);

        expect(links.newLinks).toStrictEqual(['goo']);
        expect(new Set(links.links.map((it) => it.title))).toStrictEqual(
            new Set(['foo', 'boo']),
        );
        expect(links.twoHopLinks).toStrictEqual([
            {
                src: bar,
                dst: [boz],
            },
            {
                src: miso,
                dst: [soup],
            },
            {
                src: soup,
                dst: [miso],
            },
            {
                src: jot,
                dst: [jotmisc],
            },
        ]);
    });
});

describe('Do not appear the current editing notes in 2hop links destination', () => {
    const vue = {
        title: 'Vue',
        content: `[[JavaScript]]`,
        mtime: 0,
        filename: 'Vue.md',
    };
    const javascript = {
        title: 'JavaScript',
        content: `JavaScript is a programming language.`,
        mtime: 0,
        filename: 'JS.md',
    };
    const react = {
        title: 'React',
        content: `[[JavaScript]]`,
        mtime: 0,
        filename: 'React.md',
    };
    const fileItems: FileItem[] = [vue, javascript, react];

    test('buildLinks', () => {
        const lowerTitle2fileItem: Record<string, FileItem> = {};
        fileItems.forEach(
            (it) => (lowerTitle2fileItem[it.title.toLowerCase()] = it),
        );
        const links = buildLinks(vue, lowerTitle2fileItem, fileItems);

        dumpLinks(links);

        expect(links.twoHopLinks).toStrictEqual([
            {
                src: javascript,
                dst: [react],
            },
        ]);
    });
});

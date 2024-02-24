import { expect, test } from 'vitest';
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

const lang = {
    title: 'Lang',
    content: `[[Perl]] [[BAD]]`,
    mtime: 0,
    filename: 'lang.md',
};
const perl = {
    title: 'perl',
    content: ``,
    mtime: 0,
    filename: 'perl.md',
};
const ruby = {
    title: 'ruby',
    content: `[[Perl]]`,
    mtime: 0,
    filename: 'ruby.md',
};
const fileItems: FileItem[] = [lang, perl, ruby];

test('extractLinks', () => {
    const { forward, backward } = extractLinks(fileItems);
    expect(forward).toStrictEqual(
        new Map().set('lang', ['perl', 'bad']).set('ruby', ['perl']),
    );
    expect(backward).toStrictEqual(
        new Map().set('bad', ['lang']).set('perl', ['lang', 'ruby']),
    );
});

test('buildLinks', () => {
    const links = buildLinks(lang, fileItems);

    dumpLinks(links);

    expect(links.newLinks).toStrictEqual(['bad']);
    expect(new Set(links.links.map((it) => it.title))).toStrictEqual(
        new Set([]),
    );
    expect(links.twoHopLinks).toStrictEqual([
        {
            src: perl,
            dst: [lang, ruby],
        },
    ]);
});

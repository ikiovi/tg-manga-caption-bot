import { CaptionInfo, InfoMedia, MangaType } from '../types/manga.ts';

function getCaption(info: CaptionInfo): string {
    const { id, genres, type, source: { tag } } = info;
    const tags = parseTags([`${tag}${id}`, type, ...genres ?? []]);
    const title = Array.isArray(info.title)
        ? info.title.filter(t => t !== undefined)[0] : info.title;

    return `${tags}\n${textToCode(title)}`;
}

function getPreviewCaption(tag: string, id: string | number, media: InfoMedia) {
    return `${media.caption}\n[ <a href="${media.link}">link</a> ] / [ ${textToCode(tag + id)} ]`;
}

function parseCountry(country: string): MangaType {
    switch (country) {
        case 'JP':
            return 'Manga';
        case 'KR':
            return 'Manhua';
        case 'CN':
            return 'Manhwa';
        default:
            return 'Unknown';
    }
}

function parseSynonyms(synonyms: string[], title: string, max = 10): { hasEqualValue: boolean, synonyms?: string } {
    let text = '';
    const title_regex = RegExp(title.replaceAll(' ', '|'));
    for (let i = 0, c = 0; i < synonyms.length && c < max; i++) {
        if (!(synonyms[i])) continue;
        if (synonyms[i] == title) return { hasEqualValue: true, synonyms: undefined };
        if (synonyms[i].match(title_regex)) {
            if (text) text += '\n';
            text += textToCode(synonyms[i]);
            c++;
        }
    }
    return { hasEqualValue: false, synonyms: text };
}

function parseTags(tags: string[]): string {
    return ' #' + tags?.map(tag => tag.replace(/-| /g, '_'))?.join(' #');
}

function textToCode(text: string | string[]): string {
    if (text && Array.isArray(text))
        return text.map(t => `<code>${t}</code>`).join('\n');
    return `<code>${text}</code>`;
}

export { parseSynonyms, textToCode, getCaption, parseCountry, getPreviewCaption };
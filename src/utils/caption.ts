import { TitleCaptionInfo, TitleInfo, MangaType } from '../types/manga.ts';
import { getSimilarity } from './strings.ts';

function getCaption(info: TitleCaptionInfo): string {
    const { id, genres, type, source: { tag } } = info;
    const tags = parseTags([`${tag}${id}`, type, ...genres ?? []]);
    const title = Array.isArray(info.title)
        ? info.title.filter(Boolean)[0] : info.title;

    return `${tags}\n${textToHTMLCode(title)}`;
}

function getPreviewCaption(media: TitleInfo) {
    return `${media.caption}\n[ <a href="${media.link}">link</a> ] / [ ${textToHTMLCode(media.source.tag + media.id)} ]`;
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

function parseSynonyms(synonyms: string[], title: string, max = 10): { hasEqualValue: boolean, synonyms?: string[] } {
    const average = (arr: number[]) => arr.reduce((a, b) => a + b) / arr.length;

    const weightedSynonyms = synonyms
        .map(synonym => [getSimilarity(title, synonym, average([title.length / 2, synonym.length / 2])), synonym])
        .sort((pair1, pair2) => +(pair1[0] < pair2[0]))
        .slice(0, max);

    return {
        hasEqualValue: weightedSynonyms?.at(0)?.at(0) == 1,
        synonyms: weightedSynonyms.map(pair => pair[1] as string)
    };
}

function parseTags(tags: string[]): string {
    return ' #' + tags?.map(tag => tag.replace(/-| /g, '_'))?.join(' #');
}

function textToHTMLCode(text: string | string[]): string {
    if (text && Array.isArray(text))
        return text.map(t => `<code>${t}</code>`).join('\n');
    return `<code>${text}</code>`;
}

export { parseSynonyms, textToHTMLCode, getCaption, parseCountry, getPreviewCaption };
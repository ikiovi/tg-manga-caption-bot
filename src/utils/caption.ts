import { AnilistMedia } from '../services/anilist/types';

function getCaption(media: AnilistMedia): string {
    const { id, title: { english, romaji }, genres, countryOfOrigin } = media;
    return `${parseTags([`id${id}`, parseCountry(countryOfOrigin), ...genres])}\n${textToCode(english || romaji)}`;
}

function parseCountry(country: string): string {
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

function parseSynonyms(synonyms: string[], title: string): { hasEqualValue: boolean, synonyms?: string } {
    let text = '';
    const title_regex = RegExp(title.replace(' ', '|'));

    for (let i = 0; i < synonyms.length; i++) {
        if (synonyms[i] == title) return { hasEqualValue: true, synonyms: undefined };
        if (synonyms[i].match(title_regex)) text += textToCode(synonyms[i]) + '\n';
    }
    return { hasEqualValue: false, synonyms: text };
}

function parseTags(tags: string[]): string {
    return ' #' + tags.map(tag => tag.replace(/-| /g, '_')).join(' #');
}

function textToCode(text: string): string {
    return `<code>${text}</code>`;
}

export { getCaption, parseSynonyms, textToCode };
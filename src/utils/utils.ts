function parseInput(input: string): { command: string, value: number } {
    const data = input.split(':'),
        command = data[0],
        value = Number(data[1]);
    return { command, value };
}

function parseCountry(country: string): string {
    switch (country) {
        case 'JP':
            return 'Manga'
        case 'KR':
            return 'Manhua'
        case 'CN':
            return 'Manhwa'
        default:
            return 'Unknown'
    }
}

function parseTags(tags: string[]): string {
    return ' #' + tags.join(' #').replace('-', '_');
}

function formatToCode(text: string): string {
    return `<code>${text}</code>`
}

function parseSynonyms(synonyms: string[], title: string): { hasEqualValue: boolean, synonyms?: string } {
    let text: string = '';
    const title_regex = RegExp(title.replace(' ', '|'));

    for (let i = 0; i < synonyms.length; i++) {
        if (synonyms[i] == title) return { hasEqualValue: true, synonyms: undefined };
        if (synonyms[i].match(title_regex)) text += formatToCode(synonyms[i]) + '\n';
    }
    return { hasEqualValue: false, synonyms: text };
}

export { parseInput, parseCountry, formatToCode, parseSynonyms, parseTags };
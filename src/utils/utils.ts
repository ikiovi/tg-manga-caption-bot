import { SourceType } from '../types/manga.ts';

function getRegexFromSources(arr: SourceType[]) {
    return new RegExp(`#?(?<tag>${arr.map(s => s.tag).join('|')})(?<id>\\d*)`);
}

function getFromMatch(match: string | RegExpMatchArray | undefined | null) {
    if (!match) return;
    match = match as RegExpMatchArray;
    const groups = match.groups as Record<string, string>;
    return groups;
}

function where<T extends object, F = T>(this: T, args?: Partial<F>): T {
    return Object.assign(this, args);
}

//#region Handlers
function handleResponse<T>(response: Response) {
    return response.json().then(json => response.ok ? <T>json : Promise.reject(json));
}

function handleError(error: unknown) {
    const { message, name, constructor } = <Error>error;
    console.error(`[${name}][${constructor.name}] ${message}`);
}
//#endregion

export { handleResponse, handleError, getRegexFromSources, getFromMatch, where };

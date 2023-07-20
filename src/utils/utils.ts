import { logger } from '../deps.ts';
import { SourceInfo } from '../types/manga.ts';

function getRegexFromSources(arr: SourceInfo[]) {
    return new RegExp(`#?(?<tag>${arr.map(s => s.tag).join('|')})(?<id>\\d*)`);
}

function getGroupsFromRegex(match: string | RegExpMatchArray | undefined | null) {
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
    if (!response.ok) logger.error(`${response.status}| ${response.statusText}`);
    return response.json().then(json => response.ok ? <T>json : Promise.reject(json));
}

function handleError(error: unknown) {
    logger.error(error);
}
//#endregion

export { handleResponse, handleError, getRegexFromSources, getGroupsFromRegex, where };

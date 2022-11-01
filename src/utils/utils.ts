import { crypto } from 'https://deno.land/std@0.115.1/crypto/mod.ts';
import { SourceType } from '../types/manga.ts';

function hashUserId(id: number): ArrayBuffer {
    return crypto.subtle.digestSync('MD5', new Uint32Array().fill(id));
}

function getRegexFromSources(arr: SourceType[]) {
    return new RegExp(`#?(?<tag>${arr.map(s => s.tag).join('|')})(?<id>\\d*)`);
}

function safeAwait<T>(waitFor: Promise<T>, options?: { timeout: number }): Promise<T | undefined> {
    return Promise.race<T | undefined>([
        waitFor,
        new Promise(resolve => setTimeout(resolve, options?.timeout ?? 100))
    ]);
}

function getFromMatch(match: string | RegExpMatchArray | undefined | null) {
    if (!match) return;
    match = match as RegExpMatchArray;
    const groups = match.groups as Record<string, string>;
    return groups;
}

//#region Handlers
function handleResponse(response: Response) {
    return response.json().then(json => {
        return response.ok ? json : Promise.reject(json);
    });
}

function handleError(error: unknown) {
    const { message, constructor } = <Error>error;
    console.error(`[${constructor.name}] ${message}`);
}
//#endregion

export { hashUserId, handleResponse, handleError, getRegexFromSources, getFromMatch };

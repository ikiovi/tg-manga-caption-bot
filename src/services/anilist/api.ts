import { readFileSync } from 'fs';
import { resolve, join } from 'path';
import { AnilistData, AnilistSearchData } from './types';

const queries = resolve('./resources/anilist/');

export function searchByName(search: string, callback: (result: AnilistSearchData) => void) {
    const query = readFileSync(join(queries, 'search.gql'), 'utf8');
    callApi(query, { search }, callback);
}

export function getByID(id: number, callback: (result: AnilistData) => void) {
    const query = readFileSync(join(queries, 'get.gql'), 'utf8');
    callApi(query, { id }, callback);
}

function callApi<T>(query: string, variables: { [k: string]: string | number }, callback: (data: T) => void) {
    const url = 'https://graphql.anilist.co';

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            query,
            variables
        })
    };

    fetch(url, options)
        .then(handleResponse)
        .then(callback)
        .catch(handleError);
}

//#region Handlers
function handleResponse(response: Response) {
    return response.json().then(json => {
        return response.ok ? json : Promise.reject(json);
    });
}

function handleError(error: unknown) {
    console.error(error);
}
//#endregion
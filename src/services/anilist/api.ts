import { readFileSync } from "fs";
import { AnilistData, AnilistSearchData } from "./types";

const queries = './resources/anilist/';

export function searchByName(search: string, callback: (result: AnilistSearchData) => void) {
    const query = readFileSync(`${queries}search.gql`, 'utf8')
    callApi(query, { search }, callback);
}

export function getByID(id: number, callback: (result: AnilistData) => void) {
    const query = readFileSync(`${queries}get.gql`, 'utf8')
    callApi(query, { id }, callback);
}

function callApi(query: string, variables: any, callback: Function) {
    const url = 'https://graphql.anilist.co'

    const options = {
        method: 'POST',
        headers: {
            'Content-Type' : 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            query,
            variables
        })
    };

    fetch(url, options)
        .then(handleResponse)
        .then(data => callback(data))
        .catch(handleError);
}

//#region Handlers
function handleResponse(response: Response) {
    return response.json().then(function (json) {
        return response.ok ? json : Promise.reject(json);
    });
}

function handleError(error: any) {
    console.error(error);
}
//#endregion
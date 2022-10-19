import { crypto } from 'https://deno.land/std@0.115.1/crypto/mod.ts';

function hashUserId(id: number): ArrayBuffer {
    return crypto.subtle.digestSync('MD5', new Uint32Array().fill(id));
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

export { hashUserId, handleResponse, handleError };

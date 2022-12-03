import { Context, MiddlewareFn } from '../deps.ts';
import { InfoMedia,InfoSearchMedia,SourceType } from './manga.ts';

export interface Service<C extends Context> {
    middleware(): MiddlewareFn<C>
}

export interface SourcesFlavor {
    sources: {
        getFromId: (tag: string, id: number, callback: (result?: InfoMedia | undefined) => void) => void
        getFromFID: (fid: string, callback: (result?: InfoMedia | undefined) => void) => void
        searchFromTag: (tag: string, search: string, callback: (result?: InfoSearchMedia[] | undefined) => void) => void,
        list: SourceType[]
    }
}
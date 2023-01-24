import { Context, MiddlewareFn } from '../deps.ts';
import { InfoMedia, InfoSearchMedia, SourceType } from './manga.ts';

export interface Service<C extends Context> {
    middleware(): MiddlewareFn<C>
}

export interface SourcesFlavor {
    sources: {
        getFromId: (tag: string, id: number) => Promise<InfoMedia | undefined>
        getFromFID: (fid: string) => Promise<InfoMedia | undefined>
        searchFromTag: (tag: string, search: string) => Promise<InfoSearchMedia[] | undefined>
        getFromTitle: (title: string) => Promise<InfoMedia | undefined>
        list: SourceType[]
    }
}
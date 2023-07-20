import { Context, MiddlewareFn } from '../deps.ts';
import { TitleInfo, SourceInfo, TitleSearchPage } from './manga.ts';

export interface Service<C extends Context> {
    middleware(): MiddlewareFn<C>
}

export interface SourcesFlavor {
    sources: {
        getFromId: (tag: string, id: number) => Promise<TitleInfo | undefined>
        getFromFID: (fid: string) => Promise<TitleInfo | undefined>
        searchTitle: (tag: string, title: string, page?: number) => Promise<TitleSearchPage | undefined>
        list: SourceInfo[]
    }
}
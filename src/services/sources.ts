import { Context, MiddlewareFn } from '../deps.ts';
import { MangaMedia, MangaMediaSource, MangaSearchMedia, SourceType } from '../types/manga.ts';
import { Service } from '../types/service.ts';
import { Anilist } from './manga/anilist/api.ts';
import { MangaUpdates } from './manga/mangaupdates/api.ts';
import { Bottleneck } from '../deps.ts';
import { getFromMatch, getRegexFromSources } from '../utils/utils.ts';

class Sources<
    C extends Context & SourcesFlavor
> extends Map<string, MangaMediaSource> implements Service<C>, SourcesExt {
    private limiter: Bottleneck;
    regex?: RegExp;

    constructor(sources?: ReadonlyArray<MangaMediaSource | { new(): MangaMediaSource }>, options?: Bottleneck.ConstructorOptions) {
        super();
        this.limiter = new Bottleneck(options);
        this.register(...sources ?? []);
    }

    register(...sources: ReadonlyArray<MangaMediaSource | { new(): MangaMediaSource }>) {
        sources.forEach((source) => {
            if (typeof source == 'function') source = new source();
            if (source.tag == null) {
                throw new Error('Unsupported source!');
            }
            this.set(source.tag, source);
        });
        this.regex = getRegexFromSources(this.list);
        return this;
    }

    middleware(): MiddlewareFn<C> {
        return async (ctx, next) => {
            ctx.sources = this;
            return await next();
        };
    }

    getFromId(tag: string, id: number, callback: (result?: MangaMedia | undefined) => void) {
        const source = this.get(tag);
        if (!source || !id) return;
        this.limiter.schedule(() => source.getById(id, callback));
    }

    searchFromTag(tag: string, search: string, callback: (result?: MangaSearchMedia[] | undefined) => void) {
        const source = this.get(tag);
        if (!source || !search) return;
        this.limiter.schedule(() => source.searchByTitle(search, callback));
    }

    private parseFID(fid: string): { tag: string, id: number } | undefined {
        const match = this.regex?.exec(fid);
        const groups = getFromMatch(match);
        if (!groups) return;

        const { tag, id } = groups;
        if (!tag || !(+id)) return;
        return { tag, id: +id };
    }

    getFromFID(fid: string, callback: (result?: MangaMedia | undefined) => void) {
        const { tag, id } = this.parseFID(fid) ?? {};
        if (!tag || !id) return;
        this.getFromId(tag, id, callback);
    }

    public get list(): SourceType[] {
        return [...this.values()];
    }
}


interface SourcesExt {
    getFromId: (tag: string, id: number, callback: (result?: MangaMedia | undefined) => void) => void
    getFromFID: (fid: string, callback: (result?: MangaMedia | undefined) => void) => void
    searchFromTag: (tag: string, search: string, callback: (result?: MangaSearchMedia[] | undefined) => void) => void
}

interface SourcesFlavor {
    sources: ReadonlyMap<string, SourceType> & SourcesExt
}

export { Sources, Anilist, MangaUpdates, type SourcesFlavor };
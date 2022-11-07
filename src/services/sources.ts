import { Context, MiddlewareFn } from '../deps.ts';
import { InfoMedia, InfoMediaSource, InfoSearchMedia, SourceType } from '../types/manga.ts';
import { Service } from '../types/service.ts';
import { Anilist } from './manga/anilist/api.ts';
import { MangaUpdates } from './manga/mangaupdates/api.ts';
import { Bottleneck } from '../deps.ts';
import { getFromMatch, getRegexFromSources } from '../utils/utils.ts';

class Sources<
    C extends Context & SourcesFlavor
> extends Map<string, InfoMediaSource> implements Service<C> {
    private limiter: Bottleneck;
    regex?: RegExp;

    constructor(sources?: ReadonlyArray<InfoMediaSource | { new(): InfoMediaSource }>, options?: Bottleneck.ConstructorOptions) {
        super();
        this.limiter = new Bottleneck.Group(options);
        // console.log(options);
        this.register(...sources ?? []);
    }

    register(...sources: ReadonlyArray<InfoMediaSource | { new(): InfoMediaSource }>) {
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
            const chatLimiter: Bottleneck = this.limiter.key(ctx.chat?.id);

            ctx.sources = {
                getFromFID: (...args) => this.getFromFID(chatLimiter, ...args),
                getFromId: (...args) => this.getFromId(chatLimiter, ...args),
                searchFromTag: (...args) => this.searchFromTag(chatLimiter, ...args),
                list: this.list
            };
            return await next();
        };
    }

    private getFromId(limiter: Bottleneck, tag: string, id: number, callback: (result?: InfoMedia | undefined) => void) {
        const source = this.get(tag)?.where({ fetch: limiter.wrap(fetch) });
        if (!source || !id) return;
        source.getById(id, callback);
    }

    private searchFromTag(limiter: Bottleneck, tag: string, search: string, callback: (result?: InfoSearchMedia[] | undefined) => void) {
        const source = this.get(tag)?.where({ fetch: limiter.wrap(fetch) });
        if (!source || !search) return;
        source.searchByTitle(search, callback);
    }

    private parseFID(fid: string): { tag: string, id: number } | undefined {
        const match = this.regex?.exec(fid);
        const groups = getFromMatch(match);
        if (!groups) return;

        const { tag, id } = groups;
        if (!tag || !(+id)) return;
        return { tag, id: +id };
    }

    private getFromFID(limiter: Bottleneck, fid: string, callback: (result?: InfoMedia | undefined) => void) {
        const { tag, id } = this.parseFID(fid) ?? {};
        if (!tag || !id) return;
        this.getFromId(limiter, tag, id, callback);
    }

    public get list(): SourceType[] {
        return [...this.values()];
    }
}

interface SourcesFlavor {
    sources: {
        getFromId: (tag: string, id: number, callback: (result?: InfoMedia | undefined) => void) => void
        getFromFID: (fid: string, callback: (result?: InfoMedia | undefined) => void) => void
        searchFromTag: (tag: string, search: string, callback: (result?: InfoSearchMedia[] | undefined) => void) => void,
        list: SourceType[]
    }
}

export { Sources, Anilist, MangaUpdates, type SourcesFlavor };
import { Context, MiddlewareFn } from '../deps.ts';
import { InfoMediaSource, SourceType } from '../types/manga.ts';
import { Service, SourcesFlavor } from '../types/services.ts';
import { Anilist } from './manga/anilist/api.ts';
import { MangaUpdates } from './manga/mangaupdates/api.ts';
import { Bottleneck } from '../deps.ts';
import { getFromMatch, getRegexFromSources } from '../utils/utils.ts';

class Sources<
    C extends Context & SourcesFlavor
> extends Map<string, InfoMediaSource> implements Service<C> {
    private limiter: Bottleneck.Group;
    regex?: RegExp;

    constructor(sources?: ReadonlyArray<InfoMediaSource | { new(): InfoMediaSource }>, options?: Bottleneck.ConstructorOptions) {
        super();
        this.limiter = new Bottleneck.Group(options);
        this.register(...sources ?? []);
    }

    register(...sources: ReadonlyArray<InfoMediaSource | { new(): InfoMediaSource }>) {
        sources.forEach((source) => {
            if (typeof source == 'function') source = new source();
            if (!source.tag) {
                throw new Error('Unsupported source!');
            }
            this.set(source.tag, source);
        });
        this.regex = getRegexFromSources(this.list);
        return this;
    }

    middleware(): MiddlewareFn<C> {
        return async (ctx, next) => {
            const chatLimiter: Bottleneck = this.limiter.key(`${ctx.chat?.id}`);
            ctx.sources = {
                getFromFID: (...args) => this.getFromFID(chatLimiter, ...args),
                getFromId: (...args) => this.getFromId(chatLimiter, ...args),
                searchFromTag: (...args) => this.searchFromTag(chatLimiter, ...args),
                getFromTitle: (...args) => this.getFromTitle(chatLimiter, ...args),
                list: this.list
            };
            return await next();
        };
    }

    private getFromId(limiter: Bottleneck, tag: string, id: number) {
        const source = this.get(tag)?.where({ fetch: limiter.wrap(fetch) });
        if (!source || !id) return Promise.reject<undefined>();
        return source.getById(id);
    }

    private searchFromTag(limiter: Bottleneck, tag: string, search: string) {
        const source = this.get(tag)?.where({ fetch: limiter.wrap(fetch) });
        if (!source || !search) return Promise.reject<undefined>();
        return source.searchByTitle(search);
    }

    private async getFromTitle(limiter: Bottleneck, title: string) {
        if (!title) return Promise.reject<undefined>();
        for (const source of this.values()) {
            const result = await source.where({ fetch: limiter.wrap(fetch) }).getByTitle(title);
            if (result) return result;
        }
        return Promise.reject<undefined>();
    }

    private parseFID(fid: string): { tag: string, id: number } | undefined {
        const match = this.regex?.exec(fid);
        const groups = getFromMatch(match);
        if (!groups) return;

        const { tag, id } = groups;
        if (!tag || !id) return;
        return { tag, id: +id };
    }

    private getFromFID(limiter: Bottleneck, fid: string) {
        const { tag, id } = this.parseFID(fid) ?? {};
        if (!tag || !id) return Promise.reject<undefined>();
        return this.getFromId(limiter, tag, id);
    }

    public get list(): SourceType[] {
        return [...this.values()];
    }
}

export { Sources, Anilist, MangaUpdates };

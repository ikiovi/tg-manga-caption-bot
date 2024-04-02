import { Anilist } from './manga/anilist/api.ts';
import { MangaUpdates } from './manga/mangaupdates/api.ts';
import { Service, SourcesFlavor } from '../types/services.ts';
import { TitleInfoProvider, SourceInfo } from '../types/manga.ts';
import { Context, logger, MiddlewareFn, Bottleneck } from '../deps.ts';
import { getGroupsFromRegex, getRegexFromSources } from '../utils/utils.ts';

class Sources<
    C extends Context & SourcesFlavor
> extends Map<string, TitleInfoProvider> implements Service<C> {
    private limiter: Bottleneck.Group;
    regex?: RegExp;

    constructor(sources?: ReadonlyArray<TitleInfoProvider | { new(): TitleInfoProvider }>, options?: Bottleneck.ConstructorOptions) {
        super();
        this.limiter = new Bottleneck.Group(options);
        this.register(...sources ?? []);
    }

    register(...sources: ReadonlyArray<TitleInfoProvider | { new(): TitleInfoProvider }>) {
        sources.forEach(source => {
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
                searchTitle: (...args) => this.searchTitle(chatLimiter, ...args),
                list: this.list,
                regex: this.regex
            };
            return await next();
        };
    }

    private getFromId(limiter: Bottleneck, tag: string, id: number) {
        const source = this.get(tag)?.where({ fetch: limiter.wrap(fetch) });
        if (!source || !id) return Promise.reject<undefined>();
        return source.getById(id).then(result => {
            if (!result) logger.warn(`Attempt to obtain information for id [${id}] failed. Result is empty.`);
            return result;
        });
    }

    private searchTitle(limiter: Bottleneck, tag: string, title: string, page = 1) {
        const source = this.get(tag)?.where({ fetch: limiter.wrap(fetch) });
        if (!source || !title) return Promise.reject<undefined>();
        return source.searchByTitle(title, Math.abs(page));
    }

    private getFromFID(limiter: Bottleneck, fid: string) {
        const match = this.regex?.exec(fid);
        const { tag, id } = getGroupsFromRegex(match) ?? {};
        if (!tag || !id || isNaN(+id)) return Promise.reject<undefined>();
        logger.info(`Getting info by id [${tag}${id}]`);
        return this.getFromId(limiter, tag, +id);
    }

    public get list(): SourceInfo[] {
        return [...this.values()];
    }
}

export { Sources, Anilist, MangaUpdates };

import { Context, MiddlewareFn } from '../deps.ts';
import { MangaMediaSource } from '../types/manga.ts';
import { Service } from '../types/service.ts';
import { Anilist } from './manga/anilist/api.ts';
import { MangaUpdates } from './manga/mangaupdates/api.ts';

class Sources<
    C extends Context & SourcesFlavor
> implements Service<C>{
    private sources: Map<string, MangaMediaSource>;

    constructor(sources: ReadonlyArray<{ new(): MangaMediaSource }>) {
        this.sources = new Map<string, MangaMediaSource>();
        sources.forEach(
            source => this.register(new source())
        );
    }

    register(...sources: ReadonlyArray<MangaMediaSource>) {
        sources.forEach((source) => {
            if (source.tag == null) {
                throw new Error('Unsupported source!');
            }
            this.sources.set(source.tag, source);
        });
        return this;
    }

    middleware(): MiddlewareFn<C> {
        return async (ctx, next) => {
            ctx.sources = this.sources;
            return await next();
        };
    }

    public get list(): MangaMediaSource[] {
        return [...this.sources.values()];
    }
}

interface SourcesFlavor {
    sources: ReadonlyMap<string, MangaMediaSource>
}

export { Sources, Anilist, MangaUpdates, type SourcesFlavor };
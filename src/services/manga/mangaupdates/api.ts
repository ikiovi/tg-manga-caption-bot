import { getCaption } from '../../../utils/caption.ts';
import { handleError, handleResponse, where } from '../../../utils/utils.ts';
import { MangaUpdatesData, MangaUpdatesMedia, MangaUpdatesSearchMedia } from './types.ts';
import { TitleInfo, TitleInfoProvider, PreviewType } from '../../../types/manga.ts';

export class MangaUpdates implements TitleInfoProvider {
    readonly tag = 'MU';
    readonly link = 'https://mangaupdates.com';
    readonly api = 'https://api.mangaupdates.com/v1/';
    readonly previewType: PreviewType = 'Cover';
    readonly requestOptions: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    };
    readonly fetch = fetch;
    readonly where = where<MangaUpdates, TitleInfoProvider>;

    private cache: Map<number, TitleInfo>;

    constructor(cache?: Map<number, TitleInfo>) {
        this.cache = cache ?? new Map<number, TitleInfo>();
        setInterval(() => this.cache.clear(), +(Deno.env.get('CACHE_MINUTES') ?? 5) * 2000);
    }

    async searchByTitle(search: string, page = 1) {
        const path = 'series/search';
        const perpage = 15;
        const options = {
            method: 'POST',
            ...this.requestOptions,
            body: JSON.stringify({
                page,
                search,
                perpage,
                include_rank_metadata: false
            })
        };

        const response = await this.callApi<MangaUpdatesData>(path, options);
        if (!response) return;
        const { page: currentPage, total_hits, results } = response;
        const media = results.map(this.parseMangaUpdatesSearchMedia.bind(this));
        return { currentPage, hasNextPage: (total_hits - perpage * currentPage) > 0, media }
    }

    getById(id: number) {
        const path = `series/${id}`;
        const options = {
            method: 'GET',
            ...this.requestOptions,
        };

        const cached = this.tryGetCachedMedia(id);
        if (cached) return Promise.resolve(cached);

        return this.callApi<MangaUpdatesMedia>(path, options)
            .then(response => {
                if (!response) return undefined;
                const result = this.parseMangaUpdatesMedia(response);
                this.cacheMedia(result);
                return result;
            });
    }

    private callApi<T extends MangaUpdatesMedia | MangaUpdatesData>(path: string, options: RequestInit) {
        return this.fetch(this.api + path, options)
            .then(handleResponse<T>)
            .catch(handleError);
    }

    private cacheMedia(media: TitleInfo) {
        this.cache.set(media.id, media);
    }

    private tryGetCachedMedia(id: number): TitleInfo | undefined {
        return this.cache.get(id);
    }

    private parseMangaUpdatesSearchMedia(media: MangaUpdatesSearchMedia, index: number): TitleInfo {
        const result = this.parseMangaUpdatesMedia(media?.record);
        if (index < 5) this.cacheMedia(result);
        return result;
    }

    private parseMangaUpdatesMedia(media: MangaUpdatesMedia): TitleInfo {
        const { series_id: id, url: link, genres, title, type, image } = media;
        const result = {
            id,
            link,
            title,
            source: this,
            genres: genres?.map(g => g?.genre),
            image: image.url.original
        };

        return {
            ...result,
            caption: getCaption({ ...result, type })
        };
    }
}
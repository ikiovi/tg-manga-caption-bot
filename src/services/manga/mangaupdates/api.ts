import { getCaption } from '../../../utils/caption.ts';
import { handleError, handleResponse, where } from '../../../utils/utils.ts';
import { MangaUpdatesData, MangaUpdatesMedia, MangaUpdatesSearchMedia } from './types.ts';
import { InfoMedia, InfoMediaSource, PreviewType } from '../../../types/manga.ts';

export class MangaUpdates implements InfoMediaSource {
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
    readonly where = where<MangaUpdates, InfoMediaSource>;

    private cache: Map<number, InfoMedia>;

    constructor(cache?: Map<number, InfoMedia>) {
        this.cache = cache ?? new Map<number, InfoMedia>();
        setInterval(() => this.cache.clear(), +(Deno.env.get('CACHE_MINUTES') ?? 5) * 2000);
    }

    searchByTitle(search: string) {
        return this.searchTitle(search);
    }

    getById(id: number) {
        const path = `series/${id}`;
        const options = {
            method: 'GET',
            ...this.requestOptions,
        };

        const cached = this.tryGetCachedMedia(id);
        if (cached)
            return Promise.resolve(cached);

        return this.callApi<MangaUpdatesMedia>(path, options)
            .then(response => {
                if (!response) return undefined;
                const result = this.parseMangaUpdatesMedia(response);
                this.cacheMedia(result);
                return result;
            });
    }

    getByTitle(title: string) {
        return this.searchTitle(title).then(result => result?.at(0));
    }

    private callApi<T extends MangaUpdatesMedia | MangaUpdatesData>(path: string, options: RequestInit) {
        return this.fetch(this.api + path, options)
            .then(handleResponse<T>)
            .catch(handleError);
    }

    private searchTitle(search: string): Promise<InfoMedia[] | undefined> {
        const path = 'series/search';
        const options = {
            method: 'POST',
            ...this.requestOptions,
            body: JSON.stringify({
                search
            })
        };

        return this.callApi<MangaUpdatesData>(path, options)
            .then(response => response?.results?.map(this.parseMangaUpdatesSearchMedia.bind(this)));
    }

    private cacheMedia(media: InfoMedia) {
        this.cache.set(media.id, media);
    }

    private tryGetCachedMedia(id: number): InfoMedia | undefined {
        return this.cache.get(id);
    }

    private parseMangaUpdatesSearchMedia(media: MangaUpdatesSearchMedia, index: number): InfoMedia {
        const result = this.parseMangaUpdatesMedia(media?.record);
        if (index < 5) this.cacheMedia(result);
        return result;
    }

    private parseMangaUpdatesMedia(media: MangaUpdatesMedia): InfoMedia {
        console.log('A');
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
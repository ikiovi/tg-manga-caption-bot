import { getCaption } from '../../../utils/caption.ts';
import { handleError, handleResponse, where } from '../../../utils/utils.ts';
import { MangaUpdatesData, MangaUpdatesMedia } from './types.ts';
import { InfoMedia, InfoMediaSource, InfoSearchMedia, PreviewType } from '../../../types/manga.ts';

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

    searchByTitle(search: string, callback: (result?: InfoSearchMedia[] | undefined) => void): void {
        const path = 'series/search';
        const options = {
            method: 'POST',
            ...this.requestOptions,
            body: JSON.stringify({
                search
            })
        };

        this.callApi<MangaUpdatesData>(path, options, ({results}) => {
            const result: InfoSearchMedia[] = [];
            let count = 0;
            for (const { record } of results) {
                const media = this.parseMangaUpdatesMedia(record);
                result.push(media);
                if (this.cache.has(record.series_id) || count > 7) continue; // -_-
                this.cache.set(media.id, media);
                count++;
            }
            callback(result);
        });
    }

    getById(id: number, callback: (result?: InfoMedia | undefined) => void): void {
        const path = `series/${id}`;
        const options = {
            method: 'GET',
            ...this.requestOptions,
        };

        if (this.cache.has(id))
            return callback(this.cache.get(id));

        this.callApi(path, options, (response: MangaUpdatesMedia) => {
            const result = this.parseMangaUpdatesMedia(response);
            this.cache.set(result.id, result);
            callback(result);
        });
    }

    private callApi<T extends MangaUpdatesMedia | MangaUpdatesData>(path: string, options: RequestInit, callback: (result: T) => void) {
        this.fetch(this.api + path, options)
            .then(handleResponse)
            .then(callback)
            .catch(handleError);
    }

    private parseMangaUpdatesMedia(media: MangaUpdatesMedia): InfoMedia {
        const { series_id: id, url: link, genres, title, type, image } = media;
        const result = {
            id,
            link,
            title,
            source: this,
            genres: genres?.map(g => g.genre),
            image: image.url.original
        };

        return {
            ...result,
            caption: getCaption({ ...result, type })
        };
    }
}
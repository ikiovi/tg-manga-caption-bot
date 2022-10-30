import { getCaption } from '../../../utils/caption.ts';
import { handleError, handleResponse } from '../../../utils/utils.ts';
import { MangaUpdatesData, MangaUpdatesMedia, MangaUpdatesSearchMedia } from './types.ts';
import { MangaMedia, MangaMediaSource, MangaSearchMedia, PreviewType, SourceType } from '../../../types/manga.ts';

export class MangaUpdates implements MangaMediaSource {
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

    private cache: Map<number, MangaMedia>;

    constructor(cache?: Map<number, MangaMedia>) {
        this.cache = cache ?? new Map<number, MangaMedia>();
        setInterval(this.cache.clear, (Deno.env.get('CACHE_MINUTES') ?? 20) as number * 60000);
    }

    searchByTitle(search: string, callback: (result?: MangaSearchMedia[] | undefined) => void): void {
        const path = 'series/search';
        const options = {
            method: 'POST',
            ...this.requestOptions,
            body: JSON.stringify({
                search
            })
        };

        this.callApi<MangaUpdatesData>(path, options,
            ({ results }) => {
                const result = results.map(this.parseMangaUpdatesSearchMedia);

                for (const { record } of results) {
                    const media = this.parseMangaUpdatesMedia(record);
                    this.cache.set(media.id, media);
                }

                callback(result);
            }
        );
    }

    getById(id: number, callback: (result?: MangaMedia | undefined) => void): void {
        const path = `series/${id}`;
        const options = {
            method: 'GET',
            ...this.requestOptions,
        };

        if (this.cache.has(id))
            return callback(this.cache.get(id));

        this.callApi(path, options, (response: MangaUpdatesMedia) => {
            callback(this.parseMangaUpdatesMedia(response));
        });
    }

    private callApi<T extends MangaUpdatesMedia | MangaUpdatesData>(path: string, options: RequestInit, callback: (result: T) => void) {
        fetch(this.api + path, options)
            .then(handleResponse)
            .then(callback)
            .catch(handleError);
    }

    private parseMangaUpdatesMedia(media: MangaUpdatesMedia): MangaMedia {
        const { series_id: id, url: link, genres, title, type, image } = media;
        const result = {
            id,
            link,
            title,
            source: <SourceType>this,
            image: image.url.original
        };

        return {
            ...result,
            caption: getCaption({
                type,
                genres,
                ...result,
            })
        };
    }

    private parseMangaUpdatesSearchMedia(media: MangaUpdatesSearchMedia): MangaSearchMedia {
        return this.parseMangaUpdatesMedia(media.record);
    }
}
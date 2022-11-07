import { resolve, join } from '../../../deps.ts';
import { getCaption, parseCountry } from '../../../utils/caption.ts';
import { handleError, handleResponse, where } from '../../../utils/utils.ts';
import { AnilistData, AnilistMedia, AnilistSearchData, AnilistSearchMedia } from './types.ts';
import { InfoMediaSource, PreviewType, InfoSearchMedia, InfoMedia, SourceType } from '../../../types/manga.ts';

export class Anilist implements InfoMediaSource {
    readonly tag = 'AL';
    readonly link = 'https://anilist.co';
    readonly api = 'https://graphql.anilist.co';
    readonly previewType: PreviewType = 'Link';
    readonly requestOptions: RequestInit = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    };
    readonly fetch = fetch;
    readonly where = where<Anilist, InfoMediaSource>;

    private readonly queries = resolve('./resources/anilist/');

    searchByTitle(search: string, callback: (result?: InfoSearchMedia[] | undefined) => void): void {
        const query = Deno.readTextFileSync(join(this.queries, 'search.gql'));
        this.callApi<AnilistSearchData>(query, { search }, ({ data: { Page: { media } } }) => {
            callback(media.map(m => this.parseAnilistSearchMedia(m, this)));
        });
    }

    getById(id: number, callback: (result?: InfoMedia) => void): void {
        const query = Deno.readTextFileSync(join(this.queries, 'get.gql'));
        this.callApi<AnilistData>(query, { id }, ({ data: { Media } }) => {
            callback(this.parseAnilistMedia(Media));
        });
    }

    private callApi<T extends AnilistData | AnilistSearchData>(query: string, variables: { [k: string]: string | number; }, callback: (data: T) => void) {
        const options = {
            ...this.requestOptions,
            body: JSON.stringify({
                query,
                variables
            })
        };
        this.fetch(this.api, options)
            .then(handleResponse)
            .then(callback)
            .catch(handleError);
    }

    private parseAnilistMedia(media: AnilistMedia, source: SourceType = this): InfoMedia {
        const { siteUrl: link, genres, countryOfOrigin, coverImage: { extraLarge } } = media;
        const base = this.parseAnilistSearchMedia(media, source);
        return {
            ...base,
            link,
            image: extraLarge,
            caption: getCaption({
                ...base,
                genres,
                type: parseCountry(countryOfOrigin)
            })
        };
    }

    private parseAnilistSearchMedia(media: AnilistSearchMedia, source: SourceType = this): InfoSearchMedia {
        const { id, title, synonyms } = media;
        return {
            id,
            source,
            title: [title.english ?? title.romaji, ...synonyms],
        };
    }
}
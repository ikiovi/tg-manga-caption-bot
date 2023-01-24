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

    searchByTitle(search: string) {
        const query = Deno.readTextFileSync(join(this.queries, 'search.gql'));
        return this.callApi<AnilistSearchData>(query, { search })
            .then(r => r?.data?.Page?.media?.map(m => this.parseAnilistSearchMedia(m, this)));
    }

    getById(id: number) {
        const query = Deno.readTextFileSync(join(this.queries, 'get.gql'));
        return this.callApi<AnilistData>(query, { id })
            .then(result => {
                const media = result?.data?.Media;
                return !media ? undefined : this.parseAnilistMedia(media);
            });
    }

    getByTitle(title: string) {
        const query = Deno.readTextFileSync(join(this.queries, 'searchFull.gql'));
        return this.callApi<AnilistSearchData<AnilistMedia>>(query, { search: title })
            .then(result => {
                const media = result?.data?.Page?.media?.at(0);
                return !media ? undefined : this.parseAnilistMedia(media);
            });
    }

    private async callApi<T extends AnilistData | AnilistSearchData>(query: string, variables: { [k: string]: string | number; }) {
        const options = {
            ...this.requestOptions,
            body: JSON.stringify({
                query,
                variables
            })
        };
        return this.fetch(this.api, options)
            .then(handleResponse<T>)
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
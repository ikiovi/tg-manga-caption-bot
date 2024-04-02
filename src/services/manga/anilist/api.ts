import { resolve, join } from '../../../deps.ts';
import { getCaption, parseCountry } from '../../../utils/caption.ts';
import { handleError, handleResponse, where } from '../../../utils/utils.ts';
import { AnilistData, AnilistMedia, AnilistSearchData, AnilistSearchMedia } from './types.ts';
import { TitleInfoProvider, PreviewType, TitleSearchInfo, TitleInfo } from '../../../types/manga.ts';

export class Anilist implements TitleInfoProvider {
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
    readonly where = where<Anilist, TitleInfoProvider>;

    private readonly queries = resolve('./resources/anilist/');

    async searchByTitle(search: string, page = 1) {
        const query = Deno.readTextFileSync(join(this.queries, 'search.gql'));
        const response = await this.callApi<AnilistSearchData>(query, { search, page });
        if (!response?.data) return;
        const { currentPage, hasNextPage } = response.data.Page.pageInfo;
        const media = response.data.Page.media.map(this.parseAnilistSearchMedia.bind(this));
        return { currentPage, hasNextPage, media };
    }

    getById(id: number) {
        const query = Deno.readTextFileSync(join(this.queries, 'get.gql'));
        return this.callApi<AnilistData>(query, { id })
            .then(result => {
                const media = result?.data?.Media;
                return !media ? undefined : this.parseAnilistMedia(media);
            });
    }

    private callApi<T extends AnilistData | AnilistSearchData>(query: string, variables: { [k: string]: string | number }) {
        const options = {
            ...this.requestOptions,
            body: JSON.stringify({
                query,
                variables
            })
        }; //TODO: Implement retries. Often returns 500
        return this.fetch(this.api, options)
            .then(handleResponse<T>)
            .catch(handleError);
    }

    private parseAnilistMedia(media: AnilistMedia): TitleInfo {
        const { genres, tags, countryOfOrigin, coverImage: { extraLarge } } = media;
        const base = this.parseAnilistSearchMedia(media);
        const validTags = tags.map(({ name }) => name)
            .filter(t => t.length <= 18 && (/^([a-zA-Z]| |\d)+$/).test(t))
            .slice(0, 4);

        return {
            ...base,
            image: extraLarge,
            caption: getCaption({
                ...base,
                genres: genres.concat(validTags),
                type: parseCountry(countryOfOrigin)
            })
        };
    }

    private parseAnilistSearchMedia(media: AnilistSearchMedia): TitleSearchInfo {
        const { id, title, synonyms, siteUrl: link, coverImage: { medium } } = media;
        return {
            id,
            link,
            source: this,
            title: [title.english ?? title.romaji, ...synonyms],
            image: medium
        };
    }
}
type AnilistMedia = {
    id: number
    title: {
        romaji: string
        english?: string
    }
    coverImage: {
        extraLarge: string
    }
    synonyms: string[]
    genres: string[]
    siteUrl: string
    countryOfOrigin: 'JP' | 'CN' | 'KR' | string
}

type AnilistSearchMedia = Omit<AnilistMedia, 'genres' | 'siteUrl' | 'coverImage' | 'countryOfOrigin'>;

type AnilistSearchData<M extends AnilistSearchMedia = AnilistSearchMedia> = {
    data: {
        pageInfo: {
            total: number
        }
        Page: {
            media: M[]
        }
    }
}

type AnilistData = {
    data: {
        Media: AnilistMedia
    }
}

export type { AnilistSearchData, AnilistData, AnilistMedia, AnilistSearchMedia };
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

type AnilistSearchData = {
    data: {
        pageInfo:{
            total: number
        }
        Page: {
            media: AnilistSearchMedia[]
        }
    }
}

type AnilistData = {
    data: {
        Media: AnilistMedia
    }
}

export type { AnilistSearchData, AnilistData, AnilistMedia, AnilistSearchMedia };
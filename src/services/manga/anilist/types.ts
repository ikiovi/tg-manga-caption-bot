type AnilistMedia = {
    id: number
    title: {
        romaji: string
        english?: string
    }
    coverImage: {
        extraLarge?: string
        medium?: string
    }
    tags: {
        name: string
    }[]
    synonyms: string[]
    genres: string[]
    siteUrl: string
    countryOfOrigin: 'JP' | 'CN' | 'KR' | string
}

type AnilistSearchMedia = Omit<AnilistMedia, 'genres' | 'countryOfOrigin' | 'tags'>

type AnilistSearchData<M extends AnilistSearchMedia = AnilistSearchMedia> = {
    data: {
        Page: {
            pageInfo: {
                currentPage: number
                hasNextPage: boolean
            }
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
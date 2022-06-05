export { AnilistSearchData, AnilistData, AnilistMedia, SearchAnilistMedia }

type AnilistMedia = {
    id: number
    title: {
        romaji: string,
        english: string
    }
    coverImage:{
        extraLarge: string
    }
    synonyms: string[]
    genres: string[]
    siteUrl: string
    countryOfOrigin: 'JP' | 'CN' | 'KR' | string
}

type SearchAnilistMedia = Omit<AnilistMedia, 'geners' | 'siteUrl' | 'coverImage' | 'countryOfOrigin'>;

type AnilistSearchData = {
    data : {
        pageInfo:{
            total: number
        }
        Page: {
            media: SearchAnilistMedia[]
        }
    }
}

type AnilistData = {
    data:{
        Media : AnilistMedia
    }
}
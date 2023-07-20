import { MangaType } from '../../../types/manga.ts';

type MangaUpdatesSearchMedia = {
    record: MangaUpdatesMedia
    // hit_title: string
}

type MangaUpdatesMedia = {
    series_id: number
    title: string
    url: string
    type: MangaType;
    year: string
    genres?: { genre: string }[]
    image: {
        url: {
            original: string
        }
    }
}

type MangaUpdatesData = {
    total_hits: number
    page: number
    results: MangaUpdatesSearchMedia[]
}

export type { MangaUpdatesData, MangaUpdatesMedia, MangaUpdatesSearchMedia };
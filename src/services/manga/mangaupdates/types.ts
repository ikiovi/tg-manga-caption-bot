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
    genres: string[]
    image: {
        url: {
            original: string
        }
    }
}

type MangaUpdatesData = {
    total_hits: number
    results: MangaUpdatesSearchMedia[]
}

export type { MangaUpdatesData, MangaUpdatesMedia, MangaUpdatesSearchMedia };
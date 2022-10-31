interface MangaMedia {
    source: SourceType
    id: number
    link: string
    title: string | string[]
    caption: string
    image?: string
}

type MangaSearchMedia = Pick<MangaMedia, 'id' | 'source' | 'title'>;

type CaptionInfo = MangaSearchMedia & {
    genres: string[]
    type: MangaType
}

interface SourceType {
    readonly tag: string
    readonly previewType: PreviewType
}

interface MangaMediaSource extends SourceType {
    readonly link: string
    readonly api: string

    searchByTitle(search: string, callback: (result?: MangaSearchMedia[]) => void): void
    getById(id: number, callback: (result?: MangaMedia) => void): void
}

type PreviewType = 'Cover' | 'Link';
type MangaType =
    | 'Manga' | 'Manhwa' | 'Manhua' | 'Novel' | 'OEL'
    | 'Artbook' | 'Doujinshi' | 'Drama CD'
    | 'Filipino' | 'Indonesian' | 'Thai' | 'Vietnamese'
    | 'Malaysian' | 'Nordic' | 'French' | 'Spanish' | 'Unknown';

export type { MangaMedia, MangaSearchMedia, MangaMediaSource, PreviewType, SourceType, CaptionInfo, MangaType };
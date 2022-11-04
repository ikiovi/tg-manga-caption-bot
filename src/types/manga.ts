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
    type: MangaType
    genres?: string[]
}

interface SourceType {
    readonly tag: string
    readonly previewType: PreviewType
}

interface MangaMediaSource extends SourceType {
    readonly link: string
    readonly api: string
    fetch(input: string | URL | Request, init?: RequestInit | undefined): Promise<Response>
    where(args: Partial<MangaMediaSource>): MangaMediaSource;
    searchByTitle(search: string, callback: (result?: MangaSearchMedia[]) => void): void
    getById(id: number, callback: (result?: MangaMedia) => void): void
}

const mangaTypes = ['Manga', 'Manhwa', 'Manhua', 'Novel', 'OEL',
    'Artbook', 'Doujinshi', 'Drama CD',
    'Filipino', 'Indonesian', 'Thai', 'Vietnamese',
    'Malaysian', 'Nordic', 'French', 'Spanish', 'Unknown'] as const; // For runtime checking

type PreviewType = 'Cover' | 'Link';
type MangaType = typeof mangaTypes[number];

export type { MangaMedia, MangaSearchMedia, MangaMediaSource, PreviewType, SourceType, CaptionInfo, MangaType };
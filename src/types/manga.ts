interface InfoMedia {
    source: SourceType
    id: number
    link: string
    title: string | string[]
    caption: string
    image?: string
}

type InfoSearchMedia = Pick<InfoMedia, 'id' | 'source' | 'title'>;

type CaptionInfo = InfoSearchMedia & {
    type: MangaType | 'Anime'
    genres?: string[]
}

interface SourceType {
    readonly tag: string
    readonly previewType: PreviewType
}

interface InfoMediaSource extends SourceType {
    readonly link: string
    readonly api: string
    fetch(input: string | URL | Request, init?: RequestInit | undefined): Promise<Response>
    where(args: Partial<InfoMediaSource>): InfoMediaSource
    searchByTitle(search: string): Promise<InfoSearchMedia[] | undefined>
    getByTitle(title: string): Promise<InfoMedia | undefined>
    getById(id: number): Promise<InfoMedia | undefined>
}

const mangaTypes = ['Manga', 'Manhwa', 'Manhua', 'Novel', 'OEL',
    'Artbook', 'Doujinshi', 'Drama CD',
    'Filipino', 'Indonesian', 'Thai', 'Vietnamese',
    'Malaysian', 'Nordic', 'French', 'Spanish', 'Unknown'] as const; // For runtime checking

type PreviewType = 'Cover' | 'Link';
type MangaType = typeof mangaTypes[number];

export type { InfoMedia, InfoSearchMedia, InfoMediaSource, PreviewType, SourceType, CaptionInfo, MangaType };
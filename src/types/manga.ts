interface TitleInfo {
    id: number
    link: string
    image?: string
    caption: string
    source: SourceInfo
    title: string | string[]
}

type TitleSearchInfo = Omit<TitleInfo, 'caption'>;

type TitleCaptionInfo = TitleSearchInfo & {
    type: MangaType | 'Anime'
    genres?: string[]
}

interface SourceInfo {
    readonly tag: string
    readonly previewType: PreviewType
}

type TitleSearchPage = {
    media: TitleSearchInfo[]
    currentPage: number
    hasNextPage: boolean
}

interface TitleInfoProvider extends SourceInfo {
    readonly link: string
    readonly api: string
    fetch(input: string | URL | Request, init?: RequestInit | undefined): Promise<Response>
    where(args: Partial<TitleInfoProvider>): TitleInfoProvider
    searchByTitle(search: string, page?: number): Promise<TitleSearchPage | undefined>
    getById(id: number): Promise<TitleInfo | undefined>
}

const mangaTypes = ['Manga', 'Manhwa', 'Manhua', 'Novel', 'OEL',
    'Artbook', 'Doujinshi', 'Drama CD',
    'Filipino', 'Indonesian', 'Thai', 'Vietnamese',
    'Malaysian', 'Nordic', 'French', 'Spanish', 'Unknown'] as const;

type PreviewType = 'Cover' | 'Link';
type MangaType = typeof mangaTypes[number];

export type { TitleInfo, TitleSearchInfo, TitleSearchPage, TitleInfoProvider, PreviewType, SourceInfo, TitleCaptionInfo, MangaType };
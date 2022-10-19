interface MangaMedia {
    source: SourceType;
    id: number;
    link: string;
    title: string | string[];
    caption: string;
    image?: string;
}

type MangaSearchMedia = Pick<MangaMedia, 'id' | 'source' | 'title'>

type CaptionInfo = MangaSearchMedia & {
    genres: string[];
    type: MangaType;
}


interface MangaMediaSource {
    readonly tag: string;
    readonly api: string;
    readonly previewType: PreviewType;

    searchByTitle(search: string, callback: (result?: MangaSearchMedia[]) => void): void;
    getById(id: number, callback: (result?: MangaMedia) => void): void;
}

type SourceType = Pick<MangaMediaSource, 'tag' | 'previewType'>;
type PreviewType = 'Cover' | 'Link';
type MangaType = 
    | 'Manga' | 'Manhwa' | 'Manhua' | 'Novel' | 'OEL' 
    | 'Artbook' | 'Doujinshi' | 'Drama CD' 
    | 'Filipino' | 'Indonesian' |'Thai' | 'Vietnamese' 
    | 'Malaysian' | 'Nordic' | 'French' | 'Spanish' | 'Unknown';

export type { MangaMedia, MangaSearchMedia, MangaMediaSource, PreviewType, SourceType, CaptionInfo, MangaType };
import { Context, SessionFlavor, I18nFlavor } from '../deps.ts';
import { TitleInfo } from './manga.ts';
import { SourcesFlavor } from './services.ts';
import { Empty, NotUndefined } from './utils.ts';

type BaseContext<T extends SessionData | Partial<SessionData>> = Context & I18nFlavor & SourcesFlavor & SessionFlavor<T>;
type MyContext = BaseContext<SessionData>;
type MediaContext = BaseContext<MediaSessionData>;
type SearchContext = BaseContext<SearchSessionData>;
type EmptySessionContext = BaseContext<Empty>;
type EditSessionContext = BaseContext<EditSessionData>
type SessionData = MediaSessionData & SearchSessionData & EditSessionData;

//Best naming ever
type MediaFileOptions = NotUndefined<Parameters<Context['replyWithDocument']>[1] & Parameters<Context['replyWithPhoto']>[1]> // Why? idk
export type MediaFile = {
    file_id: string
    other?: Pick<MediaFileOptions, 'parse_mode' | 'reply_markup' | 'has_spoiler'>
}

export interface MediaSessionData {
    current: {
        group_id?: string
        media?: Map<number, MediaFile>
        infoMedia?: TitleInfo
        timer?: number
        shouldCatch?: boolean
    }
}

interface SearchSessionData {
    private: {
        source?: string
    }
}

interface EditSessionData {
    private: {
        edit?: {
            infoMedia: TitleInfo
            groups: Set<string>
            posts: Map<number, number[]>
        }
    }
}

export type { MyContext, MediaContext, SearchContext, EmptySessionContext, EditSessionContext };
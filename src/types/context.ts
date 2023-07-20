import { Context, SessionFlavor, I18nFlavor } from '../deps.ts';
import { TitleInfo } from './manga.ts';
import { SourcesFlavor } from './services.ts';
import { Empty } from './utils.ts';

type BaseContext<T extends SessionData | Partial<SessionData>> = Context & I18nFlavor & SourcesFlavor & SessionFlavor<T>;
type MyContext = BaseContext<SessionData>;
type MediaContext = BaseContext<MediaSessionData>;
type SearchContext = BaseContext<SearchSessionData>;
type EmptySessionContext = BaseContext<Empty>;
type SessionData = MediaSessionData & SearchSessionData;

interface MediaSessionData {
    current: {
        group_id?: string
        media?: Map<number, string>
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

export type { MyContext, MediaContext, SearchContext, EmptySessionContext };
import { Context, SessionFlavor, I18nFlavor } from '../deps.ts';
// import { BotDB } from '../services/database.ts';
import { SourcesFlavor } from '../services/sources.ts';
import { Empty } from './utils.ts';

type BaseContext<T extends SessionData | Partial<SessionData>> = Context & I18nFlavor & SourcesFlavor & SessionFlavor<T>;
type MyContext = BaseContext<SessionData>;
type MediaContext = BaseContext<MediaSessionData>;
type SearchContext = BaseContext<SearchSessionData>;
type EmptySessionContext = BaseContext<Empty>;
type SessionData = MediaSessionData & SearchSessionData;

interface MediaSessionData{
    current: {
        id?: string | number
        media?: string | Record<number, string>
        timer?: number
        match?: { tag: string, id: number }
        shouldCatch?: boolean
    }
    // db: BotDB
}

interface SearchSessionData {
    private: {
        source?: string
    }
}

export type { MyContext, MediaContext, SearchContext, EmptySessionContext };
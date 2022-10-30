import { Context, SessionFlavor, ConversationFlavor, I18nFlavor } from '../deps.ts';
// import { BotDB } from '../services/database.ts';
import { SourcesFlavor } from '../services/sources.ts';

type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor & I18nFlavor & SourcesFlavor;

interface SessionData {
    current: {
        id?: string | number
        media?: string | Record<number, string>
        timer?: number
        match?: { tag: string, id: number }
        shouldCatch?: boolean
    }
    // db: BotDB
}

export type { SessionData, MyContext };
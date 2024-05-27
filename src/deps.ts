import 'https://deno.land/x/dotenv@v3.2.2/load.ts';
import * as logger from 'https://deno.land/std@0.221.0/log/mod.ts';
export { resolve, join } from 'https://deno.land/std@0.221.0/path/mod.ts';
export {
    Context, Bot, type SessionFlavor, session, enhanceStorage,
    InlineKeyboard, type MiddlewareFn, Composer, type NextFunction,
    type ChatTypeContext, type Enhance, MemorySessionStorage
} from 'https://deno.land/x/grammy@v1.21.2/mod.ts';
export type { InputMediaDocument, InputMediaPhoto, Message, InlineQueryResult, InlineKeyboardButton, MessageOriginChannel } from 'https://deno.land/x/grammy@v1.21.2/types.ts';
export { I18n, type I18nFlavor } from 'https://deno.land/x/grammy_i18n@v1.0.2/mod.ts';
export { parseMode } from 'https://deno.land/x/grammy_parse_mode@1.10.0/mod.ts';
export { default as Bottleneck } from 'npm:bottleneck';

const formatter = {
    dateFormat: new Intl.Locale('en-GB'),
    get(): logger.FormatterFunction {
        return ({ levelName, msg, datetime }) =>
            `[${levelName}][${datetime.toLocaleDateString(this.dateFormat)} ${datetime.toLocaleTimeString(this.dateFormat)}]: ${msg}`;
    }
};

await logger.setup({
    handlers: {
        console: new logger.ConsoleHandler('NOTSET', {
            formatter: formatter.get(),
        })
    },
    loggers: {
        default: {
            level: <logger.LevelName>(Deno.env.get('LOG_LEVEL') ?? 'INFO'),
            handlers: ['console']
        }
    }
});

export { logger };

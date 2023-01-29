import * as logger from 'https://deno.land/std@0.175.0/log/mod.ts';
export { resolve, join } from 'https://deno.land/std@0.163.0/path/mod.ts';
export { Context, Bot, type SessionFlavor, session, InlineKeyboard, type MiddlewareFn, Composer, type NextFunction, type ChatTypeContext } from 'https://deno.land/x/grammy@v1.12.0/mod.ts';
export type { InputMediaDocument, InputMediaPhoto, Message } from 'https://deno.land/x/grammy@v1.12.0/types.ts';
export type { InlineKeyboardButton } from 'https://deno.land/x/grammy@v1.12.0/types.deno.ts';
export { I18n, type I18nFlavor } from 'https://deno.land/x/grammy_i18n@v1.0.1/mod.ts';
export { default as Bottleneck } from 'npm:bottleneck@2.19.5';

const formatter = {
    dateFormat: new Intl.Locale('en-GB'),
    get(): logger.FormatterFunction {
        return ({ levelName, msg, datetime }) => 
        `[${levelName}][${datetime.toLocaleDateString(this.dateFormat)} ${datetime.toLocaleTimeString(this.dateFormat)}]: ${msg}`;
    }
};

await logger.setup({
    handlers: {
        console: new logger.handlers.ConsoleHandler('NOTSET', {
            formatter: formatter.get(),
        })
    },
    loggers: {
        default: {
            level: 'INFO',
            handlers: ['console']
        }
    }
});

export { logger };

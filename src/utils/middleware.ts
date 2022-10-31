import { Context, NextFunction } from '../deps.ts';

export function onlyAdmin<T extends Context>(errorHandler?: (ctx: T) => unknown) {
    return async (ctx: T, next: NextFunction) => {
        const { chat, from } = ctx;
        if (!chat) return;

        if (['channel', 'private'].includes(chat.type) || from?.username === 'GroupAnonymousBot') return next();
        
        if (!from?.id) return;

        const chatMemberStatus = (await ctx.getChatMember(from.id)).status;
        if (['creator', 'administrator'].includes(chatMemberStatus)) return next();

        return errorHandler?.(ctx);
    };
}

export function ignoreOld<T extends Context>(threshold = 5 * 60) {
    return (ctx: T, next: NextFunction) => {
        const { date } = ctx.msg ?? {};
        const now = new Date().getTime() / 1000;
        if (date && now - date < threshold) return next();

        if (Deno.env.get('DEBUG')) {
            return console.log(
                `[IGNORE] ${ctx.msg?.message_id} in ${ctx.chat?.id}`,
                `(${now}}:${ctx?.msg?.date})`
            );
        }
    };
}
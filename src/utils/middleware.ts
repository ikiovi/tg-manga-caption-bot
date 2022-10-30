import { Context, NextFunction } from '../deps.ts';

export function onlyAdmin<T extends Context>(errorHandler?: (ctx: T) => unknown) {
    return async (ctx: T, next: NextFunction) => {
        if (!ctx.chat || !ctx.from?.id) return;

        const isAdmin = ['channel', 'private'].includes(ctx.chat.type) || ctx.from?.username === 'GroupAnonymousBot';
        const chatMember = ctx.getChatMember(ctx.from.id);
        if (isAdmin || ['creator', 'administrator'].includes((await chatMember).status)) return next();

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
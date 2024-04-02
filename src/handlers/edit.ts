import { MessageOriginChannel } from "https://deno.land/x/grammy@v1.21.2/types.deno.ts";
import { Composer, InlineKeyboard, logger } from "../deps.ts";
import { EditSessionContext } from "../types/context.ts";

export const editHandler = new Composer<EditSessionContext>();
const internal = new Composer<EditSessionContext>();
editHandler.filter(ctx => !!ctx.session.private.edit, internal);

editHandler.command('edit', async ctx => {
    const { msg: { text }, sources } = ctx;
    const fullId = ctx.sources.regex?.exec(text)?.[0];
    if (!fullId) {
        logger.warn('No id in message ' + text);
        return ctx.reply(ctx.t('edit-no-id'));
    }
    const infoMedia = await sources.getFromFID(fullId);
    if (!infoMedia) return ctx.reply(ctx.t('edit-empty-media', { fullId }));
    ctx.session.private.edit = {
        infoMedia,
        posts: new Map(),
        groups: new Set(),
    };
    await ctx.reply(ctx.t('edit-waiting-for-posts'), {
        reply_markup: new InlineKeyboard().text(ctx.t('done-btn'), 'done')
    });
});

internal.command('cancel', ctx => ctx.session.private.edit = undefined);

internal.on('message:forward_origin:channel', ctx => {
    const { msg, session } = ctx;
    const { posts, groups } = session.private.edit!;
    if (msg.media_group_id && groups.has(msg.media_group_id)) return;
    if (msg.media_group_id) groups.add(msg.media_group_id);
    const { chat, message_id } = <MessageOriginChannel>msg.forward_origin;
    posts.set(chat.id, [...posts.get(chat.id) ?? [], message_id]);
    ctx.react('👌');
});

internal.callbackQuery('done', async ctx => {
    const { posts, infoMedia: { caption } } = ctx.session.private.edit!;
    let affectedCount = 0;
    let validCount = 0;
    const totalCount = [...posts.values()].flat().length;
    for (let channel of posts.keys() ?? []) {
        if (!posts.get(channel)?.length) continue;
        const userStatus = (await ctx.api.getChatMember(channel, ctx.from.id).catch(() => { }))?.status;
        if (!['creator', 'administrator'].includes(userStatus ?? '')) continue;

        const tasks = posts.get(channel)!.map(message_id => {
            return ctx.api.editMessageCaption(channel, message_id, { caption }).catch(() => false);
        });
        const result = await Promise.all(tasks);
        validCount += tasks.length;
        affectedCount += result.filter(Boolean).length;
    }
    ctx.answerCallbackQuery();
    ctx.editMessageReplyMarkup({});
    ctx.reply(ctx.t('edit-done', { n: affectedCount, valid: validCount, total: totalCount }));
    ctx.session.private.edit = undefined;
});

internal.on('msg', () => { }); // To prevent bot from searching when editing
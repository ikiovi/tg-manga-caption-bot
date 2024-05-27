import { ChatTypeContext, Composer, InputMediaDocument, InputMediaPhoto, NextFunction, logger } from '../deps.ts';
import { MediaContext, MediaFile } from '../types/context.ts';

export const media = new Composer<MediaContext>().chatType('channel');

media.on([':photo', ':document'], ctx => {
    setupCatch(ctx,
        (ctx.channelPost.photo?.at(-1) ?? ctx.channelPost.document)!.file_id,
        !!ctx.channelPost.document
    );
});

function setupCatch(ctx: ChatTypeContext<MediaContext, 'channel'>, file_id: string, isDocument: boolean) {
    if (!ctx.channelPost) throw new TypeError('Unreachable');
    const { current } = ctx.session;
    const { media_group_id, message_id, has_media_spoiler } = ctx.channelPost;
    logger.debug('Received media');
    if (!file_id || !current.infoMedia) return ctx.session.current.shouldCatch = false;

    const params = {
        has_spoiler: has_media_spoiler,
        parse_mode: 'HTML'
    } as const;

    if (!media_group_id) {
        ctx.deleteMessage();
        (isDocument ? ctx.replyWithDocument : ctx.replyWithPhoto).bind(ctx)(file_id, { ...params, caption: current.infoMedia.caption });
        return ctx.session.current.shouldCatch = false;
    }

    ctx.session.current.group_id ??= media_group_id;
    ctx.session.current.media ??= new Map<number, MediaFile>();
    current.media?.set(message_id, { file_id, other: params });

    if (current.group_id != media_group_id) return ctx.session.current.shouldCatch = false;
    if (current.timer) clearTimeout(current.timer);

    ctx.session.current.timer = setTimeout(() => processGroup(ctx, isDocument), 3000);
}

function processGroup(ctx: ChatTypeContext<MediaContext, 'channel'>, isDocument: boolean) {
    const { current: { media, infoMedia } } = ctx.session;
    if (!media) return logger.warn('No media. Canceling');

    const result: Array<InputMediaPhoto | InputMediaDocument> = [];

    for (const [id, m] of media) {
        if (isNaN(id)) continue;
        result.push({
            type: isDocument ? 'document' : 'photo',
            media: m.file_id,
            ...m.other
        });
        ctx.api.deleteMessage(ctx.chat.id, id);
    }
    result[0].caption = infoMedia?.caption;
    ctx.session.current.shouldCatch = false;
    ctx.replyWithMediaGroup(result);
}
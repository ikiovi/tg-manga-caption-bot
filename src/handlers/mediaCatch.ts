import { ChatTypeContext, Composer, InputMediaDocument, InputMediaPhoto, logger } from '../deps.ts';
import { MediaContext } from '../types/context.ts';

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
    if (!file_id || !current.infoMedia) return;
    const cleanUp = () => ctx.session.current = {};

    const params = {
        caption: current.infoMedia.caption,
        has_spoiler: has_media_spoiler
    } as const;

    if (!media_group_id) {
        ctx.deleteMessage();
        (isDocument ? ctx.replyWithDocument : ctx.replyWithPhoto).bind(ctx)(file_id, params);
        return cleanUp();
    }

    ctx.session.current.group_id ??= media_group_id;
    ctx.session.current.media ??= new Map<number, string>();
    current.media?.set(message_id, file_id);

    if (current.group_id != media_group_id) return cleanUp();
    if (current.timer) clearTimeout(current.timer);

    ctx.session.current.timer = setTimeout(() => processGroup(ctx, isDocument, params), 3000);
}

function processGroup(ctx: ChatTypeContext<MediaContext, 'channel'>, isDocument: boolean, params: Partial<InputMediaDocument | InputMediaPhoto>) {
    const { current: { media } } = ctx.session;
    if (!media) return logger.warn('No media. Canceling');

    const result: Array<InputMediaPhoto | InputMediaDocument> = [];

    for (const [id, file_id] of media) {
        if (isNaN(id)) continue;
        result.push({
            type: isDocument ? 'document' : 'photo',
            media: file_id
        });
        ctx.api.deleteMessage(ctx.chat.id, id);
    }
    result[0] = { ...result[0], ...params };
    ctx.session.current.shouldCatch = false;
    ctx.replyWithMediaGroup(result);
}
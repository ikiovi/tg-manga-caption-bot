import { ChatTypeContext, Composer, InputMediaDocument, InputMediaPhoto, logger } from '../deps.ts';
import { MediaContext } from '../types/context.ts';
import { InfoMedia } from '../types/manga.ts';

export const media = new Composer<MediaContext>().chatType('channel');

media.on(':photo', ctx => {
    setupCatch(ctx, ctx.channelPost.photo[0]);
});

media.on(':document', ctx => {
    setupCatch(ctx, ctx.channelPost.document);
});

function setupCatch<T extends ChatTypeContext<MediaContext, 'channel'>>(ctx: T, file?: { file_id: string }) {
    if (!ctx.channelPost) throw new Error('Invalid argument');
    const { current } = ctx.session;
    const { media_group_id, message_id, caption } = ctx.channelPost;
    if (!file || (!caption && !media_group_id)) return;
    const { file_id } = file;

    if (!media_group_id) {
        ctx.session.current = { ...current, id: message_id, media: file_id };
        process(ctx);
        return;
    }
    if (current.id != media_group_id) {
        ctx.session.current = {
            ...current,
            id: media_group_id,
            media: { [message_id]: file_id }
        };
        return;
    }
    (<Record<number, string>>ctx.session.current.media)[message_id] = file_id;
    if (current.timer) clearTimeout(current.timer);
    ctx.session.current.timer = setTimeout(() => process(ctx), 1000);
}

export function process(ctx: ChatTypeContext<MediaContext, 'channel'>) {
    const cleanUp = () => { ctx.session.current = {}; };
    if (!ctx.channelPost || !ctx.session.current.infoMedia) return cleanUp();
    logger.info('Processing media');
    processResult(ctx, ctx.session.current.infoMedia);
    cleanUp();
}

function processResult(ctx: ChatTypeContext<MediaContext, 'channel'>, result: InfoMedia) {
    if (!ctx.channelPost) throw new Error('Invalid argument');
    const { media_group_id, message_id, document, chat: { id: chat_id } } = ctx.channelPost;
    const params = { message_id, caption: result.caption, isDocument: !!document };

    if (!media_group_id) return processSingle(ctx, params);
    return processGroup(ctx, { ...params, media_group_id, chat_id });
}

function processSingle(ctx: MediaContext, params: { message_id: number, caption: string, isDocument: boolean }) {
    const { message_id, isDocument, caption } = params;
    const { id, media } = ctx.session.current;
    const file_id = media as string;
    const options = { caption, parse_mode: 'HTML' } as const;
    if (!file_id || message_id != id) return;

    ctx.deleteMessage();
    if (isDocument) return ctx.replyWithDocument(file_id, options);
    ctx.replyWithPhoto(file_id, options);
}

function processGroup(ctx: MediaContext, params: { media_group_id: string, caption: string, isDocument: boolean, chat_id: number }) {
    const { media_group_id, caption, isDocument, chat_id } = params;
    const { current } = ctx.session;
    const mediaGroup = current.media as Record<number, string>;
    if (!mediaGroup || !chat_id || current.id != media_group_id) return;

    const media: Array<InputMediaPhoto | InputMediaDocument> = [];

    for (const message_id in mediaGroup) {
        const id = +message_id;
        if (isNaN(id)) continue;
        media.push({
            type: isDocument ? 'document' : 'photo',
            media: mediaGroup[message_id]
        });
        ctx.api.deleteMessage(chat_id, id);
    }
    media[0] = { ...media[0], caption, parse_mode: 'HTML' };
    ctx.replyWithMediaGroup(media);
}
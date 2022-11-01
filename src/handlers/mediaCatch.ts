import { Composer, InputMediaDocument, InputMediaPhoto, Message } from '../deps.ts';
import { MediaContext } from '../types/context.ts';

export const media = new Composer<MediaContext>().chatType('channel');

media.on(':photo', ctx => {
    setupCatch(ctx, ctx.channelPost.photo[0]);
});

media.on(':document', ctx => {
    setupCatch(ctx, ctx.channelPost.document);
});

function setupCatch<T extends MediaContext & { channelPost: Message }>(ctx: T, file?: { file_id: string }) {
    const { media_group_id, message_id, caption } = ctx.channelPost;
    if (!file || (!caption && !media_group_id)) return;
    const { file_id } = file;

    const { current } = ctx.session;

    if (!media_group_id) {
        ctx.session.current = { ...current, id: message_id, media: file_id };
        process(ctx);
    }
    else if (current.id != media_group_id) {
        ctx.session.current = {
            ...current,
            id: media_group_id,
            media: { [message_id]: file_id }
        };
    }
    else {
        (<Record<number, string>>current.media)[message_id] = file_id;
        if (current.timer) clearTimeout(current.timer);
        current.timer = setTimeout(() => process(ctx), 1000);
    }
}

export function process(ctx: MediaContext) {
    if (!ctx.channelPost) return;
    const { tag, id } = ctx.session.current.match ?? {};
    if (!tag || !id) return;

    ctx.sources.getFromId(tag, id, result => {
        if (!result?.caption) return;

        const { media_group_id, message_id, document, chat: { id: chat_id } } = ctx.channelPost!;
        const params = { message_id, caption: result.caption, isDocument: !!document };

        if (!media_group_id) return processSingle(ctx, params);
        processGroup(ctx, { ...params, media_group_id, chat_id });
    });
}

async function processSingle(ctx: MediaContext, params: { message_id: number, caption: string, isDocument: boolean }) {
    const { message_id, isDocument, caption } = params;
    const { id, media } = ctx.session.current;
    const file_id = media as string;
    const options = { caption, parse_mode: 'HTML' } as const;
    if (!file_id || message_id != id) return;

    await ctx.deleteMessage();
    if (isDocument) return await ctx.replyWithDocument(file_id, options);
    await ctx.replyWithPhoto(file_id, options);
}

async function processGroup(ctx: MediaContext, params: { media_group_id: string, caption: string, isDocument: boolean, chat_id: number }) {
    const { media_group_id, caption, isDocument, chat_id } = params;
    const { current } = ctx.session;
    const mediaGroup = current.media as Record<number, string>;
    if (!mediaGroup || !chat_id || current.id != media_group_id) return;

    const media: Array<InputMediaPhoto | InputMediaDocument> = [];

    for (const message_id in mediaGroup) {
        const id = +message_id;
        if (isNaN(id)) continue;

        ctx.api.deleteMessage(chat_id, id);
        media.push({
            type: isDocument ? 'document' : 'photo',
            media: mediaGroup[message_id]
        });
    }
    media[0] = { ...media[0], caption, parse_mode: 'HTML' };
    await ctx.replyWithMediaGroup(media);
}
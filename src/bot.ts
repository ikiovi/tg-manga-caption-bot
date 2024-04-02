import 'https://deno.land/x/dotenv@v3.2.2/load.ts';
import { Bot, Bottleneck, Composer, I18n, session, NextFunction, ChatTypeContext, logger, InlineQueryResult, parseMode } from './deps.ts';
import { EmptySessionContext, MediaContext, MyContext } from './types/context.ts';
import { Anilist, MangaUpdates, Sources } from './services/sources.ts';
import { media } from './handlers/mediaCatch.ts';
import { search } from './handlers/search.ts';
import { editHandler } from "./handlers/edit.ts";
import { getPreviewCaption, parseSynonyms } from './utils/caption.ts';

const token = Deno.env.get('TOKEN');
if (!token) throw new Error('TOKEN must be provided!');

const bot = new Bot<MyContext>(token);

const sources = new Sources<MyContext>([Anilist, MangaUpdates], {
    maxConcurrent: 1,
    minTime: +(Deno.env.get('RL_MINTIME_MS') ?? 200),
    highWater: +(Deno.env.get('RL_MAXQUEUE') ?? 3),
    strategy: Bottleneck.strategy.OVERFLOW
});
const idRegex = (prefix = '') => new RegExp('^' + prefix + sources.regex?.source + '$');

//@ts-ignore Idk, it's screams because of different versions of grammy.
//But it also works, so...
const i18n = new I18n<MyContext>({
    defaultLocale: 'en',
    useSession: true,
    directory: 'locales',
});

const initial = () => ({});
//#region Services Registration
bot.api.config.use(parseMode('HTML'));
bot.use(session({
    type: 'multi',
    current: { initial, getSessionKey: ctx => `${ctx.chat?.id}` },
    private: { initial, getSessionKey: ctx => `${ctx.from?.id}` }
}));
bot.use(i18n, sources);
//#endregion

//#region Handlers Registration
const channelPost = new Composer<MediaContext>().chatType('channel');
const chatMessage = new Composer<EmptySessionContext>().chatType('private');

bot.chatType('channel', channelPost);
bot.chatType('private', editHandler, chatMessage, search);
//#endregion

//#region Channel
channelPost.hears(idRegex(), async (ctx, next) => {
    const { shouldCatch } = ctx.session.current;
    if (shouldCatch) ctx.session.current = {};

    const media = ctx.session.current.infoMedia = await ctx.sources.getFromFID(ctx.match[0]);
    if (!media) return logger.warn('Attempt to start media handle without info canceled');

    logger.info('Media handling started');
    ctx.session.current.shouldCatch = true;
    if (ctx.msg?.text) ctx.deleteMessage();
    await next();
});

channelPost.filter(ctx => ctx.session.current.shouldCatch ?? false, media);
channelPost.drop(ctx => ctx.session.current.shouldCatch ?? false, ctx => ctx.session.current = {});
//#endregion

//#region Private 
chatMessage.command('help', async ctx => {
    const commands = await ctx.api.getMyCommands();
    const text = !commands.length ? '_' : commands.map(
        ({ command, description }) => `/${command} - ${description}`
    ).join('\n');
    await ctx.reply(text);
});

chatMessage.hears(idRegex(), getFromIdHandler);
//#endregion

//#region Inline
bot.inlineQuery(idRegex(), async ctx => {
    if (!ctx.match?.[0]) return;
    const result = await ctx.sources.getFromFID(ctx.match[0]);
    if (!result) return;
    const caption = getPreviewCaption(result);

    await ctx.answerInlineQuery([{
        type: 'article',
        id: result.source.tag + result.id,
        title: Array.isArray(result.title) ? result.title[0] : result.title,
        url: result.link,
        hide_url: true,
        thumbnail_url: result.image,

        input_message_content: {
            message_text: caption,
            photo_url: result.image
        }
    }]);
});

bot.on('inline_query', async ctx => {
    const { query, offset: strOffset } = ctx.inlineQuery;
    const searchQuery = query.trim();
    if (!searchQuery) return;

    const offset = parseInt(strOffset) || 1;
    const source = ctx.session.private.source ?? ctx.sources.list[0].tag;
    const { media, currentPage, hasNextPage } = await ctx.sources.searchTitle(source, searchQuery, offset) ?? {};
    if (!media) return logger.error('Something went wrong');

    const result = media.map(m => {
        let title = m.title;
        if (Array.isArray(title)) {
            const { hasEqualValue, synonyms } = parseSynonyms(title, searchQuery);
            title = hasEqualValue ? searchQuery : synonyms?.at(0) ?? '';
        }
        const id = m.source.tag + m.id;
        return {
            title,
            url: m.link,
            type: 'article',
            id: 'search_' + id,
            thumbnail_url: m.image,
            input_message_content: {
                message_text: id
            },
            hide_url: true
        } as InlineQueryResult
    });

    await ctx.answerInlineQuery(result, { next_offset: hasNextPage ? `${currentPage! + 1}` : undefined });
});
//#endregion

bot.callbackQuery(idRegex('get:'), async ctx => {
    await ctx.answerCallbackQuery();
    await getFromIdHandler(ctx);
});

bot.catch(err => logger.error(`${err.name} / ${err.message}`));
bot.start({ drop_pending_updates: true });

Deno.addSignalListener('SIGINT', bot.stop);

async function getFromIdHandler(ctx: EmptySessionContext) {
    if (!ctx.match?.[0]) return;
    const result = await ctx.sources.getFromFID(ctx.match[0]);
    if (!result) return;

    const caption = getPreviewCaption(result);

    if (result.source.previewType == 'Cover' && result.image)
        return await ctx.replyWithPhoto(result.image, { caption });
    await ctx.reply(caption);
}
import 'https://deno.land/x/dotenv@v3.2.0/load.ts';
import { Bot, Bottleneck, Composer, I18n, session, NextFunction, ChatTypeContext, logger } from './deps.ts';
import { EmptySessionContext, MediaContext, MyContext } from './types/context.ts';
import { Anilist, MangaUpdates, Sources } from './services/sources.ts';
import { media } from './handlers/mediaCatch.ts';
import { search } from './handlers/search.ts';
import { getFromMatch } from './utils/utils.ts';
import { getPreviewCaption } from './utils/caption.ts';

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

const i18n = new I18n<MyContext>({
    defaultLocale: 'en',
    useSession: true,
    directory: 'locales',
});

const initial = () => ({});
//#region Services Registration
bot.use(session({
    type: 'multi',
    current: { initial },
    private: { initial }
}));
bot.use(i18n, sources);
//#endregion

//#region Handlers Registration
const channelPost = new Composer<MediaContext>().chatType('channel');
const chatMessage = new Composer<EmptySessionContext>().chatType('private');

bot.chatType('channel', channelPost);
bot.chatType('private', chatMessage, search);
//#endregion

//#region Channel Post
channelPost.hears(idRegex(), async (ctx, next) => {
    const { shouldCatch } = ctx.session.current;
    if (shouldCatch) ctx.session.current = {};

    logger.info(`Getting info by id [${ctx.match[0]}]`);
    ctx.session.current.infoMedia = await ctx.sources.getFromFID(ctx.match[0]);
    await startMediaHandle(ctx, next);
});

channelPost.hears(/-s (?<Search>.+)/i, async (ctx, next) => {
    const searchQuery = ctx.match[1];
    if (!searchQuery) return;

    const { shouldCatch } = ctx.session.current;
    if (shouldCatch) ctx.session.current = {};

    logger.info(`Getting info by title [${searchQuery}]`);
    ctx.session.current.infoMedia = await ctx.sources.getFromTitle(searchQuery);
    await startMediaHandle(ctx, next);
});

channelPost.drop(ctx => !ctx.session.current.shouldCatch, media);
//#endregion

//#region Private Chat 
chatMessage.command('help', async ctx => {
    const commands = await ctx.api.getMyCommands();
    const text = !commands.length ? '_' : commands.map(
        ({ command, description }) => `/${command} - ${description}`
    ).join('\n');
    await ctx.reply(text);
});

chatMessage.hears(idRegex(), getIdHandler);
//#endregion

bot.inlineQuery(idRegex(), async ctx => {
    const { tag, id } = getFromMatch(ctx.match) ?? {};
    if (!tag || !id) return;

    const result = await ctx.sources.getFromId(tag, +id);
    if (!result) return;

    const caption = getPreviewCaption(tag, id, result);

    await ctx.answerInlineQuery([{
        type: 'article',
        id: tag + id,
        title: Array.isArray(result.title) ? result.title[0] : result.title,
        url: result.link,
        hide_url: true,
        thumb_url: result.image,
        input_message_content: {
            message_text: caption,
            photo_url: result.image,
            disable_web_page_preview: false,
            parse_mode: 'HTML'
        }
    }]);
});

bot.callbackQuery(idRegex('get:'), async ctx => {
    await ctx.answerCallbackQuery();
    await getIdHandler(ctx);
});

bot.catch(err => logger.error(`${err.name} / ${err.message}`));
bot.start();

Deno.addSignalListener('SIGINT', () => bot.stop());

async function startMediaHandle(ctx: ChatTypeContext<MediaContext, 'channel'>, next: NextFunction) {
    const { current } = ctx.session;
    if (!current?.infoMedia) return logger.warning('Attempt to start media handle without info canceled');

    logger.info('Media handling started');
    current.shouldCatch = true;
    await next();
}

async function getIdHandler(ctx: EmptySessionContext) {
    const { tag, id } = getFromMatch(ctx.match) ?? {};
    if (!tag || !id) return;

    const options = { parse_mode: 'HTML' } as const;
    const result = await ctx.sources.getFromId(tag, +id);
    if (!result) return;

    const caption = getPreviewCaption(tag, id, result);

    if (result.source.previewType == 'Cover' && result.image)
        return await ctx.replyWithPhoto(result.image, { ...options, caption });
    await ctx.reply(caption, options);
}
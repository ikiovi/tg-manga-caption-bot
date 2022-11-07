import 'https://deno.land/x/dotenv@v3.2.0/load.ts';
import { Bot, Bottleneck, Composer, I18n, session } from './deps.ts';
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
const idRegex = () => new RegExp('^' + sources.regex?.source + '$');

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
    const groups = getFromMatch(ctx.match);
    if (!groups) return;

    const { tag, id } = groups;
    const { channelPost: { caption }, session: { current } } = ctx;
    current.match = { tag, id: +id };
    current.shouldCatch = true;
    if (!caption) ctx.deleteMessage();
    await next();
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
    const groups = getFromMatch(ctx.match);
    if (!groups) return;

    const { tag, id } = groups;
    ctx.sources.getFromId(tag, +id, async result => {
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
});

bot.callbackQuery(new RegExp('^get:' + sources.regex?.source + '$'), async ctx => {
    await ctx.answerCallbackQuery();
    await getIdHandler(ctx);
});

bot.catch(err => {
    const date = new Date();
    const dateString = `\x1b[41m[${date.toLocaleDateString()} ${date.toLocaleTimeString()}]\x1b[0m`;
    console.error(dateString, `[${err.name}] ${err.message}`);
});

bot.start();

Deno.addSignalListener('SIGINT', () => bot.stop());

function getIdHandler(ctx: EmptySessionContext) {
    const groups = getFromMatch(ctx.match);
    if (!groups) return;

    const { tag, id } = groups;
    ctx.sources.getFromId(tag, +id, async result => {
        if (!result) return;
        const caption = getPreviewCaption(tag, id, result);
        if (result.source.previewType == 'Cover' && result.image)
            return await ctx.replyWithPhoto(result.image, { caption, parse_mode: 'HTML' });
        await ctx.reply(caption, { parse_mode: 'HTML' });
    });
}
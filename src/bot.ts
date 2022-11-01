import 'https://deno.land/x/dotenv@v3.2.0/load.ts';
import { Bot, Bottleneck, Composer, I18n, session } from './deps.ts';
import { EmptySessionContext, MediaContext, MyContext } from './types/context.ts';
// import { db, getAllChannels } from './services/database.ts';
// import { DenoDBAdapter } from 'https://deno.land/x/grammy_storages@v2.0.1/denodb/src/mod.ts';
import { Anilist, MangaUpdates, Sources } from './services/sources.ts';
import { media } from './handlers/mediaCatch.ts';
import { search } from './handlers/search.ts';
import { onlyAdmin } from './utils/middleware.ts';
import { getFromMatch } from './utils/utils.ts';
import { textToCode } from './utils/caption.ts';

const token = Deno.env.get('TOKEN');
if (!token) throw new Error('TOKEN must be provided!');

const bot = new Bot<MyContext>(token);
const sources = new Sources<MyContext>([Anilist, MangaUpdates], {
    maxConcurrent: 1,
    minTime: 200,
    highWater: 5,
    strategy: Bottleneck.strategy.OVERFLOW
});

const i18n = new I18n<MyContext>({
    defaultLocale: 'en',
    useSession: true,
    directory: 'locales',
});

bot.use(session({
    type: 'multi',
    current: {
        initial: () => ({})
    },
    private: {
        initial: () => ({})
    }
    // db: {
    //     initial: () => ({ allowAliases: true }),
    //     getSessionKey: ctx => ctx.chat?.type == 'channel' ? ctx.chat.id.toString() : undefined,
    //     storage: new DenoDBAdapter(db)
    // }
}));

// await db.sync();

bot.use(onlyAdmin());
bot.use(i18n);
bot.use(sources);

const channelPost = new Composer<MediaContext>().chatType('channel');
const chatMessage = new Composer<EmptySessionContext>().chatType('private');
const idRegex = () => new RegExp('^' + sources.regex?.source + '$');

bot.chatType('channel').use(channelPost);
bot.chatType('private').use(chatMessage, search);

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

chatMessage.command('language', async (ctx) => {
    if (ctx.match === '')
        return await ctx.reply(ctx.t('language.specify-a-locale'));

    if (!i18n.locales.includes(ctx.match))
        return await ctx.reply(ctx.t('language.invalid-locale'));

    if ((await ctx.i18n.getLocale()) === ctx.match)
        return await ctx.reply(ctx.t('language.already-set'));

    await ctx.i18n.setLocale(ctx.match);
    await ctx.reply(ctx.t('language.language-set'));
});

chatMessage.hears(idRegex(), getIdHandler);
//#endregion

bot.callbackQuery(new RegExp('^get:' + sources.regex?.source + '$'), async ctx => {
    await ctx.answerCallbackQuery();
    await getIdHandler(ctx);
});

bot.catch(err => {
    const date = new Date();
    const dateString = `\x1b[41m[${date.toLocaleDateString()} ${date.toLocaleTimeString()}]\x1b[0m`;
    console.error(dateString, `${err.name}: ${err.message}`);
});

bot.start();

Deno.addSignalListener('SIGINT', () => bot.stop());

function getIdHandler(ctx: EmptySessionContext) {
    const groups = getFromMatch(ctx.match);
    if (!groups) return;

    const { tag, id } = groups;
    ctx.sources.getFromId(tag, +id, async result => {
        if (!result) return;
        const caption = `${result.caption}\n[ <a href="${result.link}">link</a> ] / [ ${textToCode(tag + id)} ]`;
        if (result.source.previewType == 'Cover' && result.image)
            return await ctx.replyWithPhoto(result.image, { caption, parse_mode: 'HTML' });
        await ctx.reply(caption, { parse_mode: 'HTML' });
    });
}
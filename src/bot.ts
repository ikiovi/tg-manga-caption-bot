import 'https://deno.land/x/dotenv@v3.2.0/load.ts';
import { Bot, I18n, conversations, session } from './deps.ts';
import { MyContext } from './types/context.ts';
// import { db, getAllChannels } from './services/database.ts';
// import { DenoDBAdapter } from 'https://deno.land/x/grammy_storages@v2.0.1/denodb/src/mod.ts';
import { ignoreOld, onlyAdmin } from './utils/middleware.ts';
import { media } from './handlers/mediaCatch.ts';
import { Anilist, MangaUpdates, Sources } from './services/sources.ts';
import { getRegexFromSources } from './utils/utils.ts';

const token = Deno.env.get('TOKEN');
if (!token) throw new Error('TOKEN must be provided!');

const bot = new Bot<MyContext>(token);
const sources = new Sources<MyContext>([Anilist, MangaUpdates]);

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
    // db: {
    //     initial: () => ({ allowAliases: true }),
    //     getSessionKey: ctx => ctx.chat?.type == 'channel' ? ctx.chat.id.toString() : undefined,
    //     storage: new DenoDBAdapter(db)
    // }
}));

// await db.sync();

bot.use(ignoreOld(), onlyAdmin());
bot.use(i18n);
bot.use(conversations());
bot.use(sources);

const channelPost = bot.chatType('channel');

channelPost.hears(getRegexFromSources(sources.list), async (ctx, next) => {
    const match = ctx.match as RegExpMatchArray;
    const groups = match.groups as Record<string, string>;
    if (!groups) return;

    const { tag, id } = groups;
    const { channelPost: { caption }, session: { current } } = ctx;
    current.match = { tag, id: +id };
    current.shouldCatch = true;
    if (!caption) ctx.deleteMessage();
    await next();
});

channelPost.drop(ctx => !ctx.session.current.shouldCatch, media);

const chatMessage = bot.chatType('private');

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

chatMessage.command('leave', ctx => ctx.conversation.exit());

bot.catch(err => {
    const date = new Date();
    const dateString = `\x1b[41m[${date.toLocaleDateString()} ${date.toLocaleTimeString()}]\x1b[0m`;
    console.error(dateString, `${err.name}: ${err.message}`);
});

bot.start();

Deno.addSignalListener('SIGINT', () => bot.stop());
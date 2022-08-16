import 'dotenv/config';
import { Scenes, session, Telegraf } from 'telegraf';
import { channels, messages } from './data';
import { postScene } from './handlers/post';
import { MyContext } from './types/context';
import { channelListKeyboard, commandInlineButton, extendedInlineKeyboard } from './utils/markup';
import { getAdminChannels, hashUserId, isAdmin, parseInput } from './utils/utils';

const token = process.env.TOKEN;
if (!token) throw new Error('TOKEN must be provided!')

const bot = new Telegraf<MyContext>(token);
const stage = new Scenes.Stage<MyContext>([postScene]);

bot.catch(err => {
    const date = new Date();
    const dateString = `\x1b[41m[${date.toLocaleDateString()} ${date.toLocaleTimeString()}]\x1b[0m`;
    const { message, name } = <Error>err;
    console.error(dateString, `${name}: ${message}`);
});

bot.use(session());
bot.use(stage.middleware());

bot.start(ctx => ctx.reply(messages.start));
bot.help(ctx => {
    ctx.telegram.getMyCommands().then(commands => {
        const text = commands.map(({ command, description }) => `/${command} - ${description}`).join('\n');
        ctx.reply(text);
    });
});

bot.command('post', async ctx => {
    const buttons: any[] = await channelListKeyboard(ctx, getAdminChannels(channels.toArray(), ctx.from.id));
    const viewAllButton = commandInlineButton('View all', 'view_all');

    if (!buttons.length && channels.length > 0) return ctx.reply(messages.emptyUserChannels, extendedInlineKeyboard(true, viewAllButton));
    else if (!buttons.length) return ctx.reply(messages.emptyChannels);
    ctx.reply(messages.selectChannel, extendedInlineKeyboard(true, ...buttons, viewAllButton));
});

bot.on('my_chat_member', async ctx => {
    const { chat, new_chat_member: { status } } = ctx.update.my_chat_member;

    if (chat.type != 'channel') return;
    if (status == 'kicked' || status == 'left') return channels.delete(chat.id);

    const admins = (await ctx.telegram.getChatAdministrators(chat.id))
        .filter(m => !m.user.is_bot)
        .map(m => hashUserId(m.user.id));
    channels.update(chat.id, admins);
})

bot.action(/channel:/, async ctx => {
    ctx.answerCbQuery();
    const { value: id } = parseInput(ctx.match.input);
    if (!await isAdmin(ctx, id, channels)) return ctx.reply(messages.accessDenied);

    ctx.scene.enter(postScene.id, { channel_id: id });
    ctx.deleteMessage();
});

bot.action('view_all', async ctx => {
    const buttons: any[] = await channelListKeyboard(ctx, channels.toArray());
    if (!buttons.length) return ctx.deleteMessage();
    ctx.editMessageReplyMarkup(extendedInlineKeyboard(true, ...buttons).reply_markup);
})

bot.action('cancel', ctx => ctx.deleteMessage());

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
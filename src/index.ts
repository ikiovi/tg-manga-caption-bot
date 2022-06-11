import 'dotenv/config';
import { Scenes, session, Telegraf } from 'telegraf';
import { Chat } from 'telegraf/typings/core/types/typegram';
import { addChannel, channels, deleteChannel, messages } from './data';
import { postScene } from './handlers/post';
import { MyContext } from './interfaces/context';
import { extendedInlineKeyboard, staticButtons } from './utils/markup';
import { isAdmin, parseInput } from './utils/utils';

const token = process.env.TOKEN;
if (!token) throw new Error('TOKEN must be provided!')

const bot = new Telegraf<MyContext>(token);
const stage = new Scenes.Stage<MyContext>([postScene]);

bot.catch(err => {
    const date = new Date();
    const dateString = `[${date.toLocaleDateString()} ${date.toLocaleTimeString()}]`;
    console.error(`${dateString} Error: `, err);
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
    const buttons: any[] = await Promise.all(channels.map(
        async channel_id => {
            const { title } = await ctx.telegram.getChat(channel_id) as Chat.SupergroupGetChat;
            return staticButtons.channel(title, channel_id);
        }
    ));

    if (!buttons.length) return ctx.reply(messages.noChannels);
    ctx.reply(messages.chooseChannel, extendedInlineKeyboard(true, ...buttons));
});

bot.on('my_chat_member', ctx => {
    const { chat, new_chat_member: { status } } = ctx.update.my_chat_member;
    if (chat.type != 'channel') return;

    if (status == 'kicked' || status == 'left') deleteChannel(chat.id);
    else addChannel(chat.id);
})

bot.action(/channel/, async ctx => {
    ctx.answerCbQuery();
    const { value: id } = parseInput(ctx.match.input);
    if (!await isAdmin(ctx, id)) return ctx.reply(messages.notAdmin);

    ctx.scene.enter(postScene.id, { channel_id: id });
    ctx.deleteMessage();
});

bot.action('cancel', ctx => ctx.deleteMessage());

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
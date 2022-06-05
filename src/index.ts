import 'dotenv/config';
import { Scenes, session, Telegraf } from 'telegraf';
import { Chat } from 'telegraf/typings/core/types/typegram';
import { addChannel, channels, deleteChannel, messages } from './data';
import { postScene } from './handlers/post';
import { MyContext } from './interfaces/context';
import { extendedInlineKeyboard, staticButtons } from './utils/markup';
import { parseInput } from './utils/utils';

const bot = new Telegraf<MyContext>(process.env.TOKEN);
const stage = new Scenes.Stage<MyContext>([postScene]);

bot.use(session());
bot.use(stage.middleware());

bot.start(ctx => ctx.reply(messages.start));
bot.help(ctx => {
    ctx.telegram.getMyCommands().then(commands => {
        const text = commands.map(command => `/${command.command} - ${command.description}`).join('\n');
        ctx.reply(text);
    });
});

bot.command('post', async ctx => {
    const buttons: any[] = await Promise.all(channels.map(
        async channel_id => {
            const channel = await bot.telegram.getChat(channel_id) as Chat.SupergroupGetChat;
            return staticButtons.channel(channel.title, channel.id);
        }
    ));

    if (!buttons.length) return ctx.reply(messages.noChannels);
    ctx.reply(messages.chooseChannel, extendedInlineKeyboard(true, ...buttons));
});

bot.on('my_chat_member', (ctx, next) => {
    const { chat, new_chat_member: { status } } = ctx.update.my_chat_member;
    if (chat.type != 'channel') return next();

    if (status == 'kicked' || status == 'left') deleteChannel(chat.id);
    else addChannel(chat.id);
})

bot.action(/channel/, async ctx => {
    ctx.answerCbQuery();
    const { value: id } = parseInput(ctx.match.input);
    const isAdmin = (await bot.telegram.getChatAdministrators(id)).findIndex(member => member.user == ctx.from);
    if (!isAdmin) return ctx.reply(messages.notAdmin);

    ctx.scene.enter(postScene.id, { channel_id: id });
    ctx.deleteMessage();
});

bot.action('cancel', ctx => ctx.deleteMessage());

bot.launch();
import 'https://deno.land/x/dotenv/load.ts';
import { Bot, session, Context } from './deps.ts';
import { conversations, ConversationFlavor } from './deps.ts';

const token = Deno.env.get('TOKEN');
if (!token) throw new Error('TOKEN must be provided!');

const bot = new Bot<Context & ConversationFlavor>(token);

bot.catch(err => {
    const date = new Date();
    const dateString = `\x1b[41m[${date.toLocaleDateString()} ${date.toLocaleTimeString()}]\x1b[0m`;
    const { message, name } = <Error>err;
    console.error(dateString, `${name}: ${message}`);
});

bot.use(
    session({
        initial() {
            return {};
        }
    })
);
bot.use(conversations());

// ...

bot.command('help', async ctx => {
    const commands = await ctx.api.getMyCommands();
    const text = !commands.length ? '_' : commands.map(({ command, description }) => `/${command} - ${description}`).join('\n');
    ctx.reply(text);
});

bot.command('leave', ctx => ctx.conversation.exit());

bot.start();

Deno.addSignalListener('SIGINT', () => bot.stop());
Deno.addSignalListener('SIGBREAK', () => bot.stop());
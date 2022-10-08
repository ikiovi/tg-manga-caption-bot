import { Markup, Scenes } from 'telegraf';
import { InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram';
import { channels, messages } from '../data';
import { MyContext } from '../types/context';
import { channelListKeyboard, extendedInlineKeyboard, staticButtons } from '../utils/markup';
import { parseInput } from '../utils/utils';

export const moderateScene = new Scenes.BaseScene<MyContext>('MODERATE_SCENE');

moderateScene.enter(ctx => {
    ctx.reply(messages.moderatePanelEnter);
});

moderateScene.command('channels', async ctx => {
    const keyboard = await getKeyboard(ctx);
    ctx.reply(!channels.length ? messages.emptyChannels : messages.moderateChannels, keyboard);
});

moderateScene.action(/^delete_channel:/, async ctx => {
    ctx.answerCbQuery();
    const { value } = parseInput(ctx.match.input);
    if (!channels.has(value)) return ctx.deleteMessage();
    const keyboard = await getKeyboard(ctx, value);

    ctx.telegram.leaveChat(value).catch(() => 0);
    if (!channels.length) ctx.editMessageText(messages.emptyChannels, keyboard);
    else ctx.editMessageReplyMarkup(keyboard.reply_markup);
});

async function getKeyboard(ctx: MyContext, exclude?: number): Promise<Markup.Markup<InlineKeyboardMarkup>> {
    let cache: Map<number, any> = (ctx.scene.state as any).buttons;

    if (!cache || cache.size != channels.length) {
        const buttons = await channelListKeyboard(ctx, channels.toArray(), staticButtons.delete_channel);

        cache = new Map<number, any>(channels.toArray().map(
            (channel, i) => {
                return [channel.id, buttons[i]];
            }
        ));
        (<any>ctx.scene.state).buttons = cache;
    }
    if (exclude) {
        cache.delete(exclude);
        (<any>ctx.scene.state).buttons = cache;
    }

    return extendedInlineKeyboard(true, ...cache.values());
}
import { Scenes } from 'telegraf';
import { channels, messages } from '../data';
import { MyContext } from '../types/context';
import { HideableIKBtn } from '../types/markup';
import { TelegramInlineKeyboard } from '../types/telegram';
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

async function getKeyboard(ctx: MyContext, exclude?: number): Promise<TelegramInlineKeyboard> {
    let cache = (ctx.scene.state as StateChache).buttons;

    if (!cache || cache.size != channels.length) {
        const buttons = await channelListKeyboard(ctx, channels.toArray(), staticButtons.delete_channel);

        cache = new Map<number, HideableIKBtn>(channels.toArray().map(
            (channel, i) => {
                return [channel.id, buttons[i]];
            }
        ));
        (<StateChache>ctx.scene.state).buttons = cache;
    }
    if (exclude) {
        cache.delete(exclude);
        (<StateChache>ctx.scene.state).buttons = cache;
    }

    return extendedInlineKeyboard(true, ...cache.values());
}

type StateChache = {
    buttons?: Map<number, HideableIKBtn>;
}
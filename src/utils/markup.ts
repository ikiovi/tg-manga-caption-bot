import { Markup, TelegramError } from 'telegraf';
import { Chat } from 'telegraf/typings/core/types/typegram';
import { channels, messages } from '../data';
import { Channel } from '../types/channels';
import { MyContext } from '../types/context';
import { HideableIKBtn } from '../types/markup';
import { TelegramInlineKeyboard } from '../types/telegram';

const staticButtons = {
    cancel: (text: string = messages.cancel) => commandInlineButton(text, 'cancel'),
    accept: commandInlineButton(messages.post, 'accept'),
    choose: (text: string, id: number) => commandInlineButton(text, 'choose', id),
    channel: (text: string, id: number) => commandInlineButton(text, 'channel', id),
    delete_channel: (text: string, id: number) => commandInlineButton(text, 'delete_channel', id),
    collectComplete: commandInlineButton(messages.done, 'media_collected')
};

function inlineKeyboardFromArray<T>(array: T[], maxColumns: number, hasCancel: boolean, predicate: (value: T, index: number) => HideableIKBtn): TelegramInlineKeyboard {
    const buttons: HideableIKBtn[][] = new Array<HideableIKBtn[]>(Math.floor(array.length / maxColumns));

    for (let i = 0, r = 0; i < array.length; i++, r = Math.floor(i / maxColumns)) {
        const button = predicate(array[i], i);
        const row = buttons[r] ??= [];
        row.push(button);
    }
    if (hasCancel) buttons.push([staticButtons.cancel()]);
    return Markup.inlineKeyboard(buttons);
}

function commandInlineButton(text: string, command: string, id?: number, hide?: boolean): HideableIKBtn {
    const data = (id) ? `${command}:${id}` : command;
    return Markup.button.callback(text, data, hide);
}

function extendedInlineKeyboard(oneColumn: boolean, ...buttons: HideableIKBtn[]): TelegramInlineKeyboard {
    let result : HideableIKBtn[] |  HideableIKBtn[][] = buttons.filter(b => !!b);
    if (oneColumn) {
        result = result.map(button => [button]);
        return Markup.inlineKeyboard(result as HideableIKBtn[][]);
    }
    return Markup.inlineKeyboard(result);
}

async function channelListKeyboard(ctx: MyContext, _channels: Channel[], buttonType?: (text: string, id: number) => HideableIKBtn): Promise<HideableIKBtn[]> {
    return Promise.all(
        _channels.map(
            async ({ id }) => {
                try {
                    // ? Cache
                    const { title } = await ctx.telegram.getChat(id) as Chat.SupergroupGetChat;
                    return (buttonType ?? staticButtons.channel)(title, id);
                }
                catch(e){
                    if(e instanceof TelegramError && e.code == 400) channels.delete(id);
                    return undefined;
                }
            }
        ).filter(b => !!b)
    ) as unknown as Promise<HideableIKBtn[]>;
}

export {
    inlineKeyboardFromArray,
    commandInlineButton,
    staticButtons,
    extendedInlineKeyboard,
    channelListKeyboard
};
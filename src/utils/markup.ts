import { Markup } from "telegraf";
import { Chat, InlineKeyboardMarkup } from "telegraf/typings/core/types/typegram";
import { messages } from "../data";
import { Channel } from "../types/channels";
import { MyContext } from "../types/context";

const staticButtons = {
    cancel: (text: string = messages.cancel) => commandInlineButton(text, 'cancel'),
    accept: commandInlineButton(messages.post, 'accept'),
    choose: (text: string, id: number) => commandInlineButton(text, 'choose', id),
    channel: (text: string, id: number) => commandInlineButton(text, 'channel', id),
    collectComplete: commandInlineButton(messages.done, 'media_collected')
};

function inlineKeyboardFromArray<T>(array: T[], maxColumns: number, hasCancel: boolean, predicate: (value: T, index: number) => any): Markup.Markup<InlineKeyboardMarkup> {
    const buttons: any[][] = new Array<any[]>(Math.floor(array.length / maxColumns)); // Cant find type HideableIKBtn[][]"

    for (let i = 0, r = 0; i < array.length; i++, r = Math.floor(i / maxColumns)) {
        const button = predicate(array[i], i);
        const row = buttons[r] ??= [];
        row.push(button);
    }
    if (hasCancel) buttons.push([staticButtons.cancel()]);
    return Markup.inlineKeyboard(buttons);
}

function commandInlineButton(text: string, command: string, id?: number): any {
    const data = (id) ? `${command}:${id}` : command;
    return Markup.button.callback(text, data);
}

function extendedInlineKeyboard(oneColumn: boolean, ...buttons: any[]): Markup.Markup<InlineKeyboardMarkup> {
    buttons = buttons.filter(button => !!button);
    if (oneColumn) buttons = buttons.map(button => [button]);
    return Markup.inlineKeyboard(buttons);
}

async function channelListKeyboard(ctx: MyContext, channels: Channel[]): Promise<any[]> {
    return Promise.all(channels.map(
        async ({ id }) => {
            const { title } = await ctx.telegram.getChat(id) as Chat.SupergroupGetChat; // TODO: Cache titles to prevent ddos
            return staticButtons.channel(title, id);
        }
    ));
}

export {
    inlineKeyboardFromArray,
    commandInlineButton,
    staticButtons,
    extendedInlineKeyboard,
    channelListKeyboard
};
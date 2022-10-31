import { InlineKeyboard, InlineKeyboardButton } from '../deps.ts';

export function inlineKeyboardFromArray<T>(array: T[], predicate: (value: T, index: number) => InlineKeyboardButton, options?: { maxColumns: number }): InlineKeyboard {
    const { maxColumns } = options ?? { maxColumns: 8 };
    const buttons: InlineKeyboardButton[][] = new Array<InlineKeyboardButton[]>(Math.floor(array.length / maxColumns));

    for (let i = 0, r = 0; i < array.length; i++, r = Math.floor(i / maxColumns)) {
        const button = predicate(array[i], i);
        const row = buttons[r] ??= [];
        row.push(button);
    }
    return new InlineKeyboard(buttons);
}
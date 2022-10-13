import { Markup } from 'telegraf';
import { InlineKeyboardMarkup, InputMediaAudio, InputMediaDocument, InputMediaPhoto, InputMediaVideo } from 'telegraf/typings/core/types/typegram';


type TelegramMediaGroup = ReadonlyArray<InputMediaPhoto | InputMediaVideo> 
                        | readonly InputMediaAudio[] 
                        | readonly InputMediaDocument[]

type TelegramOnlyPhotoGroup = readonly (InputMediaPhoto | InputMediaDocument)[];

type TelegramInlineKeyboard = Markup.Markup<InlineKeyboardMarkup>

export { TelegramMediaGroup, TelegramOnlyPhotoGroup, TelegramInlineKeyboard };


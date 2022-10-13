import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';

type Hideable<B> = B & { hide?: boolean }
type HideableIKBtn = Hideable<InlineKeyboardButton>

export { HideableIKBtn };
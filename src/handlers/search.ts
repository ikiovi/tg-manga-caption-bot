import { Composer, InlineKeyboard } from '../deps.ts';
import { SearchContext } from '../types/context.ts';
import { MangaSearchMedia } from '../types/manga.ts';
import { parseSynonyms, textToCode } from '../utils/caption.ts';
import { inlineKeyboardFromArray } from '../utils/markup.ts';
import { getFromMatch } from '../utils/utils.ts';

export const search = new Composer<SearchContext>().chatType('private');

search.command('setSource', async ctx => {
    const keyboard = Array.from(ctx.sources.keys())
        .reduce<InlineKeyboard>(
            (k, t) => k.text(
                ctx.t('source-' + t.toLowerCase()),
                'search:' + t
            ), new InlineKeyboard()
        );

    await ctx.reply(ctx.t('select-source'), { reply_markup: keyboard });
});

search.callbackQuery(/^search:(?<tag>[a-zA-Z]*)/, async ctx => {
    await ctx.answerCallbackQuery();
    const groups = getFromMatch(ctx.match);
    if (!groups) return;
    const { tag } = groups;
    ctx.session.private.source = tag;
    const name = ctx.t('source-' + tag.toLowerCase());
    if (!name) return;
    await ctx.editMessageText(ctx.t('current-source', { name }), { reply_markup: undefined, parse_mode: 'HTML' });
});

search.on(':text', ctx => {
    if (!ctx.session.private.source) return;
    //!: add https://grammy.dev/plugins/transformer-throttler.html
    const source = ctx.sources.get(ctx.session.private.source);
    if (!source) return;
    const { text } = ctx.message;
    source.searchByTitle(text, media => {
        if (!media) return;
        const { message, result, keyboard } = parseMedia(media, text);
        if (!result) return ctx.reply(ctx.t(message));
        ctx.reply(message, { reply_markup: keyboard, parse_mode: 'HTML' });
    });
});


function parseMedia(media: MangaSearchMedia[], search: string): { keyboard?: InlineKeyboard, message: string, result: boolean } {
    if (!media.length) return { keyboard: undefined, message: 'title-not-found', result: false };

    let message = '';
    const keyboard = inlineKeyboardFromArray<MangaSearchMedia>(media,
        (value, i) => {
            const { id, source, title } = value;

            if (Array.isArray(title)) {
                const { hasEqualValue, synonyms } = parseSynonyms(title, search);
                if (hasEqualValue || synonyms) message += `${i + 1}. ${hasEqualValue ? textToCode(search) : synonyms}\n`;
            }
            else message += `${i + 1}. ${textToCode(title)}\n`;

            return {
                text: `${i + 1}`,
                callback_data: `get:${source.tag}${id}`
            };
        }
    );
    return { keyboard, message, result: true };
}
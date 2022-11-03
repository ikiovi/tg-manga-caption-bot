import { Composer, InlineKeyboard } from '../deps.ts';
import { SearchContext } from '../types/context.ts';
import { MangaSearchMedia } from '../types/manga.ts';
import { parseSynonyms, textToCode } from '../utils/caption.ts';
import { inlineKeyboardFromArray } from '../utils/markup.ts';
import { getFromMatch } from '../utils/utils.ts';

export const search = new Composer<SearchContext>().chatType('private');

search.command(['setSource', 'setsource'], async ctx => {
    const keyboard = ctx.sources.list.reduce<InlineKeyboard>(
            (k, { tag }) => k.text(
                ctx.t('source-' + tag.toLowerCase()),
                'search:' + tag
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
    const { source } = ctx.session.private;
    if (!source) return;
    const { text } = ctx.message;
    ctx.sources.searchFromTag(source, text, media => {
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
            const c = `${i + 1}. `;
            let current = '';
            if (Array.isArray(title)) {
                const { hasEqualValue, synonyms } = parseSynonyms(title, search);
                if (hasEqualValue || synonyms) current = `${c}${hasEqualValue ? textToCode(search): synonyms}\n`;
                else current = c + textToCode(title[0]) + '\n';
            }
            if (!current) current += `${c}${textToCode(title)}\n`;
            message += current + '\n';

            return {
                text: `${i + 1}`,
                callback_data: `get:${source.tag}${id}`
            };
        }
    );
    return { keyboard, message, result: true };
}

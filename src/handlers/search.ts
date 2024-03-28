import { Composer, InlineKeyboard, logger } from '../deps.ts';
import { SearchContext } from '../types/context.ts';
import { TitleSearchInfo } from '../types/manga.ts';
import { parseSynonyms, textToHTMLCode } from '../utils/caption.ts';
import { inlineKeyboardFromArray } from '../utils/markup.ts';
import { getGroupsFromRegex } from '../utils/utils.ts';

export const search = new Composer<SearchContext>().chatType('private');

search.command(['setSource', 'setsource'], async ctx => {
    const buttons = ctx.sources.list.map(
        ({ tag }) => InlineKeyboard.text(
            ctx.t('source-' + tag.toLowerCase()),
            'search:' + tag
        )
    );

    await ctx.reply(ctx.t('select-source'), { reply_markup: InlineKeyboard.from([buttons]) });
});

search.callbackQuery(/^search:(?<tag>[a-zA-Z]*)/, async ctx => {
    await ctx.answerCallbackQuery();
    const { tag } = getGroupsFromRegex(ctx.match) ?? {};
    if (!tag) return;
    ctx.session.private.source = tag;
    const name = ctx.t('source-' + tag.toLowerCase());
    if (!name) return;
    await ctx.editMessageText(ctx.t('current-source', { name }), { reply_markup: undefined });
});

search.on(':text', async ctx => {
    const { session, sources, message: { text } } = ctx;
    const source = session.private.source ?? sources.list[0].tag;
    const { media } = await sources.searchTitle(source, text) ?? {};
    if (!media) return logger.error('Something went wrong');
    const { message, result, keyboard } = parseMedia(media, text);
    if (!result) return ctx.reply(ctx.t(message));
    ctx.reply(message, { reply_markup: keyboard });
});

//??
function parseMedia(media: TitleSearchInfo[], search: string): { keyboard?: InlineKeyboard, message: string, result: boolean } {
    if (!media.length) return { keyboard: undefined, message: 'title-not-found', result: false };
    const message: string[] = [];
    const keyboard = inlineKeyboardFromArray<TitleSearchInfo>(media, (...args) => inlineButtonFromMedia(...args, message, search));
    return { keyboard, message: message.join('\n'), result: true };
}

function inlineButtonFromMedia(media: TitleSearchInfo, index: number, message: string[], search: string) {
    const { id, source, title } = media;
    let current = '';
    if (Array.isArray(title)) {
        const { hasEqualValue, synonyms } = parseSynonyms(title, search);
        if (hasEqualValue || synonyms) current = textToHTMLCode(hasEqualValue ? search : synonyms!) + '\n';
        else current = textToHTMLCode(title[0]) + '\n';
    }
    if (!current) current = `${textToHTMLCode(title)}\n`;
    message.push(`${index + 1}. ` + current);

    return {
        text: `${index + 1}`,
        callback_data: `get:${source.tag}${id}`
    };
}
//

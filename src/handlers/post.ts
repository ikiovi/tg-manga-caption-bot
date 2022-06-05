import { Markup, Scenes } from 'telegraf';
import { InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram';
import { ExtraPhoto } from 'telegraf/typings/telegram-types';
import { messages } from '../data';
import { DocumentContext, MyContext, PhotoContext } from '../interfaces/context';
import { extendedInlineKeyboard, inlineKeyboardFromArray, staticButtons } from '../utils/markup';
import { getByID, searchByName } from '../services/anilist/api';
import { SearchAnilistMedia } from '../services/anilist/types';
import { formatToCode, parseCountry, parseInput, parseSynonyms, parseTags } from '../utils/utils';
import { clearState, getState, setState, WaitStates } from '../utils/waitStates';

export const postScene = new Scenes.BaseScene<MyContext>('POST_SCENE');

postScene.enter(ctx => {
    ctx.scene.session.files = [];
    waitForMedia(ctx);
});

postScene.command('cancel', cancelHandler);
postScene.command('leave', ctx => ctx.scene.leave());

postScene.on('text', (ctx, next) => {
    if (!getState(ctx, WaitStates.Title)) return next();
    const title = ctx.message.text;

    searchByName(title, ({ data: { Page: { media } } }) => {
        const { keyboard, message } = parseMedia(media, title);
        ctx.replyWithHTML(message, keyboard);
    });
});

postScene.on('document', photoHandler);
postScene.on('photo', photoHandler);

postScene.action(/choose/, ctx => {
    ctx.answerCbQuery();
    if (!getState(ctx, WaitStates.Title) && !ctx.scene.session.files.length) return;
    const { value: id } = parseInput(ctx.match.input);

    getByID(id, ({ data: { Media } }) => {
        clearState(ctx, WaitStates.Title);

        const { id, title: { english, romaji }, genres, countryOfOrigin, siteUrl } = Media;
        const caption = ctx.scene.session.caption = `${parseTags([`id${id}`, parseCountry(countryOfOrigin), ...genres])}\n${formatToCode(english || romaji)}`;
        const keyboard = extendedInlineKeyboard(true,
            staticButtons.accept(messages.post, 0),
            (ctx.scene.session.files.length > 1) ? staticButtons.accept(messages.postSeparate, 1) : undefined,
            staticButtons.cancel()
        );

        ctx.replyWithHTML(`${caption}\n<a href="${siteUrl}">Link</a>`, keyboard);
    });
});

postScene.action('media_collected', ctx => {
    ctx.answerCbQuery();
    if (getState(ctx, WaitStates.Media) && ctx.scene.session.files.length) {
        setState(ctx, WaitStates.Title);
        ctx.editMessageReplyMarkup(undefined);
        ctx.reply(messages.waitForTitle);
    }
})

postScene.action(/accept/, async ctx => {
    ctx.answerCbQuery();
    const { channel_id } = (<any>ctx.scene.state);
    const isAdmin = (await ctx.telegram.getChatAdministrators(channel_id)).findIndex(member => member.user == ctx.from);

    if (!isAdmin) {
        ctx.deleteMessage();
        ctx.reply(messages.notAdmin);
        return ctx.scene.leave();
    }
    const { files, caption, isDocument } = ctx.scene.session;
    const type = (isDocument) ? 'document' : 'photo';
    const { value: postType } = parseInput(ctx.match.input);

    if (files.length == 1 || postType) files.forEach(file => sendSinglePhoto(file));
    else if (files.length > 1) sendMediaGroup(files);
    else ctx.reply('Error: No Images');

    function sendSinglePhoto(file: string) {
        const extra: ExtraPhoto = { caption, parse_mode: 'HTML' };

        if (type == 'document') ctx.telegram.sendDocument(channel_id, file, extra);
        else ctx.telegram.sendPhoto(channel_id, file, extra);
    }

    function sendMediaGroup(files: string[]) {
        ctx.telegram.sendMediaGroup(channel_id, createMediaGroup(files, caption, type))
    }

    ctx.editMessageReplyMarkup(undefined);
    ctx.scene.reenter();
});

postScene.action('cancel', cancelHandler);


function photoHandler(ctx: PhotoContext | DocumentContext) {
    if (!getState(ctx, WaitStates.Media)) return;

    const photo_id: string | undefined = (<PhotoContext>ctx).message?.photo[0]?.file_id;
    const document_id: string | undefined = (<DocumentContext>ctx).message?.document?.file_id;

    ctx.scene.session.isDocument = !!document_id;
    ctx.scene.session.files.push(photo_id ?? document_id);
}

function waitForMedia(ctx: MyContext) {
    setState(ctx, WaitStates.Media);
    ctx.reply(messages.waitForMedia, extendedInlineKeyboard(false, staticButtons.collectComplete, staticButtons.cancel(messages.retry)));
}

function cancelHandler(ctx: MyContext) {
    ctx.deleteMessage();
    if (getState(ctx, WaitStates.Title)) waitForMedia(ctx);
    else if (ctx.scene.session.files.length) setState(ctx, WaitStates.Title);
    else if (getState(ctx, WaitStates.Media)) ctx.scene.reenter();
    else ctx.scene.leave();
}

function parseMedia(media: SearchAnilistMedia[], title: string): { keyboard?: Markup.Markup<InlineKeyboardMarkup>, message: string } {
    if (!media.length) return { keyboard: undefined, message: messages.titleNotFound };

    let message = '';
    const keyboard = inlineKeyboardFromArray<SearchAnilistMedia>(media, 8, true,
        (value, i) => {
            const { romaji, english } = value.title;
            const { hasEqualValue, synonyms } = parseSynonyms(value.synonyms, title);

            message += `${i + 1}. ${formatToCode(english ?? romaji)}\n`;
            if (hasEqualValue || synonyms) message += `${(hasEqualValue) ? formatToCode(title) : synonyms}\n`;
            return staticButtons.choose(`${i + 1}`, value.id);
        }
    );
    return { keyboard, message };
}

function createMediaGroup(photos: string[], caption: string, type: 'photo' | 'document' = 'photo'): any[] {
    return photos.map((photo_id, i) => {
        return {
            type,
            media: photo_id,
            parse_mode: 'HTML',
            caption: (i) ? undefined : caption
        };
    });
}
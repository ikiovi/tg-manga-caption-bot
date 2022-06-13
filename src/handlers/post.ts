import { Markup, Scenes } from 'telegraf';
import { InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram';
import { ExtraPhoto } from 'telegraf/typings/telegram-types';
import { messages } from '../data';
import { DocumentContext, MyContext, PhotoContext } from '../types/context';
import { commandInlineButton, extendedInlineKeyboard, inlineKeyboardFromArray, staticButtons } from '../utils/markup';
import { getByID, searchByName } from '../services/anilist/api';
import { SearchAnilistMedia } from '../services/anilist/types';
import { formatToCode, getCaption, isAdmin, parseInput, parseSynonyms } from '../utils/utils';
import { clearState, getState, initStates, setState, WaitStates } from '../utils/waitStates';

export const postScene = new Scenes.BaseScene<MyContext>('POST_SCENE');

postScene.enter(ctx => {
    ctx.scene.session.files = [];
    waitForMedia(ctx);
});

postScene.command('cancel', cancelHandler);
postScene.command('leave', ctx => ctx.scene.leave());

postScene.on('text', ctx => {
    if (!getState(ctx, WaitStates.Title)) return;
    const title = ctx.message.text;

    searchByName(title, ({ data: { Page: { media } } }) => {
        const { keyboard, message } = parseMedia(media, title);
        ctx.replyWithHTML(message, keyboard);
        setState(ctx, WaitStates.Choose);
    });
});

postScene.on('document', photoHandler);
postScene.on('photo', photoHandler);

postScene.action(/choose/, ctx => {
    ctx.answerCbQuery();
    if (!(getState(ctx, WaitStates.Title) || getState(ctx, WaitStates.Choose)) || !ctx.scene.session.files.length) return;
    const { value: id } = parseInput(ctx.match.input);

    getByID(id, ({ data: { Media } }) => {
        initStates(ctx);

        ctx.scene.session.cached_id = id;
        const caption = ctx.scene.session.caption = getCaption(Media);
        const keyboard = extendedInlineKeyboard(true,
            staticButtons.accept,
            staticButtons.cancel()
        );

        ctx.replyWithHTML(`${caption}\n<a href="${Media.siteUrl}">Link</a>`, keyboard);
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

    const { channel_id } = (<{ channel_id: number }>ctx.scene.state);
    const { files, mediaType: type, cached_id, caption } = ctx.scene.session;
    let error = !await isAdmin(ctx, channel_id) ? messages.notAdmin : !cached_id || !caption ? messages.noCached : undefined;

    if (error) {
        ctx.editMessageReplyMarkup(undefined);
        ctx.reply(error);
        return ctx.scene.leave();
    }

    if (files.length == 1) sendSinglePhoto(files.pop()!);
    else if (files.length > 1) sendMediaGroup(files);
    else ctx.reply(messages.noMediaCached);

    function sendSinglePhoto(file: string) {
        const extra: ExtraPhoto = { caption, parse_mode: 'HTML' };

        if (type == 'document') ctx.telegram.sendDocument(channel_id, file, extra);
        else ctx.telegram.sendPhoto(channel_id, file, extra);
    }

    function sendMediaGroup(files: string[]) {
        ctx.telegram.sendMediaGroup(channel_id, createMediaGroup(files, caption, type))
    }

    ctx.editMessageReplyMarkup(
        extendedInlineKeyboard(true, commandInlineButton(messages.again, 'choose', cached_id)).reply_markup
    );
    ctx.scene.reenter();
});

postScene.action('cancel', cancelHandler);


function photoHandler(ctx: PhotoContext | DocumentContext) {
    if (!getState(ctx, WaitStates.Media)) return;

    const photo_id: string | undefined = (<PhotoContext>ctx).message?.photo?.shift()?.file_id;
    const document_id: string | undefined = (<DocumentContext>ctx).message?.document?.file_id;

    const type = !!document_id ? 'document' : 'photo';
    const mediaType = ctx.scene.session.mediaType ??= type;

    if (type == mediaType) ctx.scene.session.files.push(photo_id ?? document_id);
    else ctx.reply(`Current media type: ${type}\nExpected media type: ${mediaType}`)
}

function waitForMedia(ctx: MyContext) {
    setState(ctx, WaitStates.Media);
    ctx.reply(messages.waitForMedia, extendedInlineKeyboard(false, staticButtons.collectComplete, staticButtons.cancel(messages.retry)));
}


// TODO
function cancelHandler(ctx: MyContext) {
    ctx.deleteMessage();
    const { length } = ctx.scene.session.files;
    if (getState(ctx, WaitStates.Title)) waitForMedia(ctx);
    else if (length && getState(ctx, WaitStates.Media)) ctx.scene.reenter();
    else if (getState(ctx, WaitStates.Choose) || length) setState(ctx, WaitStates.Title);
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
            if (hasEqualValue || synonyms) message += `${hasEqualValue ? formatToCode(title) : synonyms}\n`;
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
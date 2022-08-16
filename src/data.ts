import { readFileSync } from "fs";
import { resolve } from "path";
import { Channels } from "./types/channels";

const messages: BotText = JSON.parse(readFileSync(resolve('./text.json'), 'utf-8'));

(function () {
    const keys = Object.keys(messages);
    keys.forEach(key => {
        if (!messages[key].length) throw new Error(`Text "${messages[key]}" in text.json, in "${key}" is invalid.`);
    });
})();

const fileName = process.env.CHANNELS.replace(/['"]+/g, '') ?? './channels.json';
const path = resolve(fileName);

const channels = new Channels(path);

export { messages, channels }

type BotText = { //TODO: Move it somewhere
    post: string
    done: string
    retry: string
    clear: string
    cancel: string
    titleNotFound: string
    selectChannel: string
    leavePostCtx: string
    waitTitle: string
    captionCacheError: string
    mediaCacheError: string
    accessDenied: string
    emptyChannels: string
    emptyUserChannels: string
    waitMedia: string
    mediaCount: string
    start: string
    [key: string]: string
}
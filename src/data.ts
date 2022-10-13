import { resolve } from 'path';
import { Channels } from './types/channels';

const messages = { 
    post: 'Post',
    done: 'Done',
    retry: 'Again',
    clear: 'Clear',
    cancel: 'Cancel',
    titleNotFound: 'No matches found.',
    selectChannel: 'Select a channel:',
    leavePostCtx: 'Leaving channel context',
    waitTitle: 'Please enter title.',
    captionCacheError: 'No cached caption. Try again.',
    mediaCacheError: 'No cached media. Try again.',
    accessDenied: 'Access is denied. You are not the admin of this channel.',
    emptyChannels: 'Channel list is empty. First you need to add bot to the channel.',
    emptyUserChannels: 'Could not find channels where you are an admin. You can see the entire list.',
    waitMedia: 'Please send pictures.',
    mediaCount: 'Media count: {count}',
    start: 'This bot provides a convenient way to caption moments from manga / manhua / manhwa.\nThe bot uses the Anilist API.',
    invalidPassword: 'Password is invalid. \nCommand example:<pre>/moderate ~Password~</pre>',
    moderateChannels: 'Select a channel to delete:',
    moderatePanelEnter: 'Success.'
};

const fileName = process.env?.CHANNELS?.replace(/['"]+/g, '') ?? './channels.json';
const path = resolve(fileName);

const channels = new Channels(path);

export { messages, channels };
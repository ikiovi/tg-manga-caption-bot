import { readFileSync, writeFileSync } from "fs"
import { resolve } from "path";

const messages = {
    start: 'This bot provides a convenient way to caption moments from manga / manhua / manhwa.\nThe bot uses the Anilist API.',
    waitForTitle: 'Please enter title.',
    notAdmin: 'Access is denied. You are not the admin of this channel',
    waitForMedia: (count: number) => `Please send pictures. ${count == 0 ? '' : `\nMedia count: ${count}`}`,
    titleNotFound: 'No matches found.',
    chooseChannel: 'Select a channel:',
    noChannels: 'Channel list is empty. First you need to add bot to the channel.',
    again: 'Again',
    post: 'Post',
    clear: 'Clear',
    cancel: 'Cancel',
    done: 'Done',
    noCached: 'No cached caption. Try again.',
    noMediaCached: 'No cached media. Try again.',
    exitPost: 'Leaving /post context.'
}

let channels: number[] = [];
const fileName = process.env.CHANNELS.replace(/['"]+/g, '') ?? './channels.json';
const path = resolve(fileName);

(function () {
    try {
        channels = JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
        saveChannels();
    }
})();

//#region 
function addChannel(id: number) {
    channels.push(id);
    saveChannels();
}

function deleteChannel(id: number) {
    channels = channels.filter(value => value != id);
    saveChannels();
}

function saveChannels() {
    writeFileSync(path, JSON.stringify(channels), 'utf-8');
}
//#endregion

export { messages, addChannel, deleteChannel, saveChannels, channels }


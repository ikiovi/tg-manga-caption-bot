import { resolve } from "path";
import { readFileSync, writeFileSync } from "fs"

const messages = {
    post: 'Post',
    done: 'Done',
    again: 'Again',
    clear: 'Clear',
    cancel: 'Cancel',
    titleNotFound: 'No matches found.',
    chooseChannel: 'Select a channel:',
    exitPost: 'Leaving /post context.',
    waitForTitle: 'Please enter title.',
    noCached: 'No cached caption. Try again.',
    noMediaCached: 'No cached media. Try again.',
    notAdmin: 'Access is denied. You are not the admin of this channel',
    noChannels: 'Channel list is empty. First you need to add bot to the channel.',
    waitForMedia: (count: number) => `Please send pictures. ${count == 0 ? '' : `\nMedia count: ${count}`}`,
    start: 'This bot provides a convenient way to caption moments from manga / manhua / manhwa.\nThe bot uses the Anilist API.',
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

export { messages, addChannel, deleteChannel, channels }


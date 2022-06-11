import { readFileSync, writeFileSync } from "fs"
import { join } from "path";

const messages = {
    start: 'This bot provides a convenient way to caption moments from manga / manhua / manhwa.\nThe bot uses the Anilist API.',
    waitForTitle: 'Please enter title',
    notAdmin: 'Access is denied. You are not the admin of this channel',
    waitForMedia: 'Please send pictures',
    titleNotFound: 'No Matches found',
    chooseChannel: 'Select a channel:',
    noChannels: 'Channel list is empty. First you need to add bot to the channel',
    again: 'Again',
    post: 'Post',
    retry: 'Retry',
    cancel: 'Cancel',
    done: 'Done!',
    noCached: 'No cached caption. Try again.',
    noMediaCached: 'No cached media. Try again.'
}

let channels: number[] = [];
const path = join(__dirname, process.env.CHANNELS);

(function () {
    try {
        channels = JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
        writeFileSync(process.env.CHANNELS, JSON.stringify([]));
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
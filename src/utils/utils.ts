import { createHash } from 'crypto';
import { ChatMember } from 'telegraf/typings/core/types/typegram';
import { Channel, Channels } from '../types/channels';
import { MyContext } from '../types/context';

function parseInput(input: string): { command: string, value: number } {
    const data = input.split(':'),
        command = data[0],
        value = Number(data[1]);
    return { command, value };
}

function hashUserId(id: number): string {
    return createHash('md5').update(id.toString()).digest('hex');
}

function getAdminChannels(channels: Channel[], id: number): Channel[] {
    const hid = hashUserId(id);
    return channels.filter(channel => new Set(channel.admins).has(hid));
}

async function isAdmin(ctx: MyContext, channel_id: number, channels: Channels): Promise<boolean> {
    if (!channels.has(channel_id)) return false;

    const date = new Date();
    const { next_update } = <Channel>channels.get(channel_id);

    if (next_update && date < next_update) {
        const member = await ctx.telegram.getChatMember(channel_id, ctx.from?.id ?? 0);
        return member.status == 'administrator' || member.status == 'creator';
    }

    let result = false;
    const hash = (member: ChatMember) => {
        const { id } = member.user;
        if (ctx.from?.id ?? 0 == id) result = true;
        return hashUserId(id);
    };

    const admins = (await ctx.telegram.getChatAdministrators(channel_id))
        .filter(m => !m.user.is_bot)
        .map(hash);
    
    channels.update(channel_id, admins);
    return result;
}

export { parseInput, isAdmin, hashUserId, getAdminChannels };

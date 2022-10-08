import { writeFileSync, readFileSync } from 'fs';

const update_cd = (process.env?.UPDATE_CD_MINUTES ?? 10) * 60000;

class Channels {
    private _channels: Map<number, Omit<Channel, 'id'>> = new Map<number, Omit<Channel, 'id'>>();
    private _path?: string;

    public length = 0;

    constructor(path?: string) {
        if (!path) return;
        this._path = path;


        try {
            const arr: Channel[] = JSON.parse(readFileSync(path, 'utf-8'));
            arr.forEach(c => this._channels.set(c.id, c));
            this.length = arr.length;
        } catch {
            this.save();
        }
    }

    public delete(id: number): boolean {
        if (!this.has(id)) return false;
        const result = this._channels.delete(id);
        this.length = this._channels.size;
        this.save();
        return result;
    }

    public has(id: number): boolean {
        return this._channels.has(id);
    }

    public update(channel_id: number, admins: string[]) {
        const next_update = new Date(Date.now() + update_cd);

        this._channels.set(channel_id, {
            admins,
            next_update
        });
        this.length++;
        this.save();
    }

    public get(id: number): Channel | undefined {
        if (!this._channels.has(id)) return undefined;
        return { id, ...this._channels.get(id)! };
    }

    public toArray(): Channel[] {
        const result: Channel[] = [];
        this._channels.forEach((val, id) => result.push({ id, ...val }));
        return result;
    }

    public save() {
        if (!this._path) return;
        const arr = this.toArray();
        writeFileSync(this._path, JSON.stringify(arr), 'utf-8');
    }
}

type Channel = {
    id: number
    admins: string[]
    next_update?: Date
}

export { Channel, Channels, update_cd };
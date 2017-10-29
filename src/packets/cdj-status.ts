import { CDJStateFlags } from '../constants';

const header = Buffer.from([
    0x51, 0x73, 0x70, 0x74, 0x31, 0x57, 0x6d, 0x4a, 0x4f, 0x4c, 0x0a
]);

export interface CDJState {
    playing: boolean;
    sync: boolean;
    master: boolean;
    onAir: boolean;
}

export const mapCdjState = (flag: number): CDJState => ({
    playing: !!(flag & CDJStateFlags.Play),
    sync: !!(flag & CDJStateFlags.Sync),
    master: !!(flag & CDJStateFlags.Master),
    onAir: !!(flag & CDJStateFlags.OnAir)
});

export interface CDJStatus {
    name: string;
    device: number;
    state: CDJState;
    speed: {
        pitch: number;
        bpm: number;
        current: number;
    }
}

export const test = (buffer: Buffer): boolean =>
    buffer.slice(0, header.length).equals(header);

export const parse = (buffer: Buffer): CDJStatus => {
    const device = buffer[0x21];
    const name = buffer.toString('utf8', 0x0b, 0x1e);
    const state = mapCdjState(buffer[0x89]);
    const pitch = buffer.readInt32BE(0x8c);
    const bpm = buffer.readInt16BE(0x92);
    const current = (bpm * pitch) / 0x6400000;
    return {
        device,
        name,
        state,
        speed: {
            pitch,
            bpm,
            current
        }
    };
};
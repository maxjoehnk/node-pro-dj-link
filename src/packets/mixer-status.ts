import { CDJStateFlags } from '../constants';
import { CDJState, mapCdjState } from './cdj-status';

const header = Buffer.from([
    0x51, 0x73, 0x70, 0x74, 0x31, 0x57, 0x6d, 0x4a, 0x4f, 0x4c, 0x29
]);

export interface MixerStatus {
    name: string;
    device: number;
    state: CDJState;
    speed: {
        pitch: number;
        bpm: number;
    }
}

export const test = (buffer: Buffer): boolean =>
    buffer.slice(0, header.length).equals(header);

export const parse = (buffer: Buffer): MixerStatus => {
    const device = buffer[0x21];
    const name = buffer.toString('utf8', 0x0b, 0x1e);
    const state = mapCdjState(buffer[0x27]);
    const pitch = buffer.readInt32BE(0x28);
    const bpm = buffer.readInt16BE(0x2e);
    return {
        device,
        name,
        state,
        speed: {
            pitch,
            bpm
        }
    };
};
const header = Buffer.from([
    0x51, 0x73, 0x70, 0x74, 0x31, 0x57, 0x6d, 0x4a, 0x4f, 0x4c, 0x28
]);

export interface TimingPacket {
    speed: {
        original: number;
        pitch: number;
        current: number;
    }
    device: number;
    name: string;
}

export const test = (buffer: Buffer): boolean =>
    buffer.slice(0, header.length).equals(header);

export const parse = (buffer: Buffer): TimingPacket => {
    const device = buffer[0x21];
    const name = buffer.toString('utf8', 0x0b, 0x1e);
    const original = buffer.readInt16BE(0x5a);
    const pitch = buffer.readInt32BE(0x54);
    const current = (original * pitch) / 0x6400000;
    return {
        speed: {
            original,
            pitch,
            current,
        },
        device,
        name
    };
};
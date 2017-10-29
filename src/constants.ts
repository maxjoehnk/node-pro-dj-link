export const ANNOUNCEMENT_PORT = 50000;
export const KEEP_ALIVE_HEADER = Buffer.from([
    0x51, 0x73, 0x70, 0x74, 0x31, 0x57, 0x6d, 0x4a, 0x4f, 0x4c, 0x06, 0x00
]);
export enum CDJStateFlags {
    OnAir = 8,
    Sync = 16,
    Master = 32,
    Play = 64
}
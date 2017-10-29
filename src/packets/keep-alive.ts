import { KEEP_ALIVE_HEADER } from '../constants';
import { fromLong } from 'ip';
import { toString } from 'mac-address';

export interface CDJKeepAlivePackage {
    name: string;
    device: number;
    mac: string;
    ip: string;
    type: 'CDJ' | 'Mixer';
}

export const test = (buffer: Buffer): boolean =>
    buffer.slice(0, KEEP_ALIVE_HEADER.length).equals(KEEP_ALIVE_HEADER) &&
    buffer.length === 0x36;

/**
 * 0x01 == CDJ
 * 0x02 == Mixer
 */
const isCdj = (buffer: Buffer): boolean =>
    buffer[0x34] === 0x01 && buffer[0x25] === 0x01;

const getDeviceName = (buffer: Buffer): string =>
    buffer.toString('utf8', 0x0b, 0x20);

const getDeviceNumber = (buffer: Buffer): number =>
    buffer[0x24];

const getDeviceMac = (buffer: Buffer): string =>
    toString(buffer, 0x26);

const getDeviceIp = (buffer: Buffer): string => fromLong(buffer.readInt32BE(0x2c));

export const parse = (buffer: Buffer): CDJKeepAlivePackage => {
    if (!test(buffer)) {
        throw new InvalidPacketHeader();
    }
    return {
        name: getDeviceName(buffer),
        device: getDeviceNumber(buffer),
        mac: getDeviceMac(buffer),
        ip: getDeviceIp(buffer),
        type: isCdj(buffer) ? 'CDJ' : 'Mixer'
    };
};

export class InvalidPacketHeader extends Error {
    constructor() {
        super('Unexpected Packet Header');
    }
}
import { createSocket } from 'dgram';
import { networkInterfaces } from 'os';
import { subnet } from 'ip';
import * as mixerStatus from './packets/mixer-status';
import * as cdjStatus from './packets/cdj-status';
import * as debug from 'debug';
import { ANNOUNCEMENT_PORT, KEEP_ALIVE_HEADER } from './constants';
import { toLong } from 'ip';
import { toBuffer } from 'mac-address';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { CDJState } from './packets/cdj-status';

const d = debug('pro-dj-link:virtual-cdj');

export interface DeviceStatus {
    name: string;
    device: number;
    state: CDJState;
    speed: {
        pitch: number;
        bpm: number;
        current: number;
    }
}

export class VirtualCdj {
    private broadcast: string;
    private mac: string;
    private ip: string;
    private socket;

    private _bpm: BehaviorSubject<number> = new BehaviorSubject(0);
    private _devices: BehaviorSubject<DeviceStatus[]> = new BehaviorSubject([]);

    constructor(networkDevice: string, private device: number = 0x05) {
        const interfaces = networkInterfaces();
        const addresses = interfaces[networkDevice];
        if (!addresses) {
            throw new Error('Invalid Network Device');
        }
        const [addr] = addresses
            .filter(({ family }) => family === 'IPv4');
        if (!addr) {
            throw new Error('Invalid Network Device');
        }
        const { broadcastAddress } = subnet(addr.address, addr.netmask);
        this.broadcast = broadcastAddress;
        this.mac = addr.mac;
        this.ip = addr.address;
        this.socket = createSocket('udp4');

        this.socket.on('message', (data, remote) => {
            if (mixerStatus.test(data)) {
                const status = mixerStatus.parse(data);
                d(`Mixer Status ${status.device} (${status.name})`);
            }else if (cdjStatus.test(data)) {
                const status = cdjStatus.parse(data);
                d(`CDJ Status ${status.device} (${status.name})`);
                if (status.state.master) {
                    this._bpm.next(status.speed.current);
                }
                const current = this._devices.getValue()
                    .filter(({ device }) => device !== status.device);
                this._devices.next([...current, status]);
            }else {
                d(data);
            }
        });
        this.socket.on('error', err => {
            console.error(err);
            this.socket.close();
        });
        this.socket.on('listening', () => {
            this.socket.setBroadcast(true);
            this.socket.setMulticastTTL(128);
            setInterval(this.keepalive, 1500);
            const { address, port } = this.socket.address();
            d(`Virtual CDJ Running on ${address}:${port}`);
        });
        this.socket.bind({
            port: 50002
        });
    }

    private keepalive = () => {
        const name = Buffer.alloc(0x14);
        name.write('Virtual CDJ');
        const mac = toBuffer(this.mac);
        const ip = Buffer.alloc(4);
        ip.writeUInt32BE(toLong(this.ip), 0);
        const a = Buffer.from([
            0x01, 0x02, 0x00, 0x36, this.device, 0x01,
        ]);
        const b = Buffer.from([
            0x01, 0x00, 0x00, 0x00, 0x01, 0x00
        ]);
        const packet = Buffer.concat([
            KEEP_ALIVE_HEADER,
            name,
            a,
            mac,
            ip,
            b
        ]);
        this.socket.send(packet, ANNOUNCEMENT_PORT, this.broadcast, err => {
            if (err) {
                console.error(err);
            }
            d('Send Keep Alive Packet');
        });
    }

    get devices(): Observable<DeviceStatus[]> {
        return this._devices.asObservable();
    }

    get bpm(): Observable<number> {
        return this._bpm.asObservable();
    }
}
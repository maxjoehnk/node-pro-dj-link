import * as debug from 'debug';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { createSocket } from 'dgram';
import { ANNOUNCEMENT_PORT } from './constants';
import * as keepalive from './packets/keep-alive';
import { Observable } from 'rxjs/Observable';

const d = debug('pro-dj-link:search');

export interface BaseDevice {
    name: string;
    device: number;
}

const _devices: BehaviorSubject<BaseDevice[]> = new BehaviorSubject([]);

export const search = () => {
    const socket = createSocket({
        type: 'udp4',
        reuseAddr: true
    });
    socket.bind({
        port: ANNOUNCEMENT_PORT
    }, () => {
        socket.setBroadcast(true);
        socket.setMulticastTTL(128);
    });
    socket.on('message', data => {
        if (keepalive.test(data)) {
            const {
                name,
                device,
                ip,
                mac
            } = keepalive.parse(data);
            d(`Player ${device} (${name})`, mac, ip);
        }else {
            d('50000', data);
        }
    });
};

export const devices: Observable<BaseDevice[]> = _devices.asObservable();

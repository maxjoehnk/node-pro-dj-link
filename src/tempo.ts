import * as debug from 'debug';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { createSocket } from 'dgram';
import * as timing from './packets/timing';

const d = debug('pro-dj-link:bpm');
const _bpm: BehaviorSubject<number> = new BehaviorSubject(0);

export const track = () => {
    d('Starting BPM Tracking');
    const socket = createSocket({
        type: 'udp4',
        reuseAddr: true
    });
    socket.bind({
        port: 50001
    }, () => {
        socket.setBroadcast(true);
        socket.setMulticastTTL(128);
    });
    socket.on('message', (data: Buffer) => {
        if (timing.test(data)) { // Timing Packet
            const {
                device,
                name,
                speed
            } = timing.parse(data);
            d(`Player ${device} (${name}): ${Math.round(speed.current)} BPM`);
            d(speed.current);
            _bpm.next(speed.current);
        }else {
            d('50001', data.length, data);
        }
    });
};

export const bpm: Observable<number> = _bpm.asObservable();
import type {Hardware} from './contracts';
export type DeviceFilter='all'|'phone'|'tablet';
export function isMobileDevice(item:Pick<Hardware,'kind'|'deviceType'>){return item.kind==='phone'&&(item.deviceType===undefined||item.deviceType==='phone'||item.deviceType==='tablet');}
export function matchesDevice(item:Pick<Hardware,'kind'|'deviceType'>,filter:DeviceFilter){return isMobileDevice(item)&&(filter==='all'||(item.deviceType??'phone')===filter);}

import {fail} from './errors.js';
export const TRANSITION_KEY='nv2_persistence_migration_v1';
export async function sourceDigest(raw){const bytes=new TextEncoder().encode(JSON.stringify(raw));const hash=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');}
export function readTransition(storage){
 const raw=storage.getItem(TRANSITION_KEY);if(raw===null)return null;
 let value;try{value=JSON.parse(raw);}catch{fail('invalid-transition');}
 if(!value||value.version!==1||typeof value.token!=='string'||!value.token||!['prepared','committed'].includes(value.phase)||typeof value.digest!=='string'||!/^[0-9a-f]{64}$/.test(value.digest))fail('invalid-transition');
 return value;
}
export function writeTransition(storage,value){
 const raw=JSON.stringify(value);storage.setItem(TRANSITION_KEY,raw);
 if(storage.getItem(TRANSITION_KEY)!==raw)fail('transition-unconfirmed');
}
export function sameTransition(a,b){return a?.token===b?.token&&a?.digest===b?.digest&&a?.phase===b?.phase;}

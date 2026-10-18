import {validateLegacy,LEGACY_KEYS} from './legacy.js';
import {SHIPS} from '../content.js';
import {fail} from './errors.js';
export const SCHEMA_VERSION=1,WRITER_VERSION=1,MAX_BALANCE=1e9;
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const int=(v,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
export function initialState(snapshot){
 return {version:SCHEMA_VERSION,minWriter:WRITER_VERSION,revision:0,economy:{balance:snapshot.profile.credits,history:[]},migration:{id:'legacy-v1',complete:true,raw:structuredClone(snapshot.raw),profile:structuredClone(snapshot.profile),preferences:structuredClone(snapshot.preferences)},upgrades:{ships:Object.fromEntries(Object.keys(SHIPS).map(id=>[id,{armor:0,engines:0,nova:0}])),weapons:{flux:0,impact:0,missile:0},drones:{alpha:0,beta:0}},fleet:Object.fromEntries(Object.entries(SHIPS).map(([id,s])=>[id,{currentHp:s.hp,destroyed:false,rescueDueAt:null,reservation:null}])),lastResort:{obtained:false,voucherGranted:false,voucherConsumed:false}};
}
export function validateState(s){
 if(!object(s)||s.version!==SCHEMA_VERSION||s.minWriter!==WRITER_VERSION)fail('future-or-invalid-state');
 if(!int(s.revision)||!object(s.economy)||!int(s.economy.balance,MAX_BALANCE)||!Array.isArray(s.economy.history)||s.economy.history.length>100)fail('invalid-economy');
 if(!object(s.migration)||s.migration.id!=='legacy-v1'||s.migration.complete!==true||!object(s.migration.raw)||!object(s.migration.profile)||!object(s.migration.preferences))fail('invalid-migration');
 for(const key of LEGACY_KEYS){if(s.migration.raw[key]!==null&&typeof s.migration.raw[key]!=='string')fail('invalid-backup');validateLegacy(key,s.migration.raw[key]);}
 const u=s.upgrades;if(!object(u)||!object(u.ships)||!object(u.weapons)||!object(u.drones)||!object(s.fleet))fail('invalid-upgrades');
 for(const id of Object.keys(SHIPS)){
  if(!object(u.ships[id])||!['armor','engines','nova'].every(k=>int(u.ships[id][k],5)))fail('invalid-upgrades');
  const f=s.fleet[id];if(!object(f)||!Number.isFinite(f.currentHp)||f.currentHp<0||f.currentHp>SHIPS[id].hp*(1+.1*u.ships[id].armor)||typeof f.destroyed!=='boolean'||f.destroyed!==(f.currentHp===0)||!(f.rescueDueAt===null||int(f.rescueDueAt))||!(f.reservation===null||object(f.reservation)&&typeof f.reservation.attemptId==='string'&&typeof f.reservation.owner==='string'&&int(f.reservation.expiresAt)))fail('invalid-fleet');
 }
 for(const id of ['flux','impact','missile'])if(!int(u.weapons[id],5))fail('invalid-upgrades');
 for(const id of ['alpha','beta'])if(!int(u.drones[id],5))fail('invalid-upgrades');
 const l=s.lastResort;if(!object(l)||!['obtained','voucherGranted','voucherConsumed'].every(k=>typeof l[k]==='boolean')||l.voucherGranted&&!l.obtained||l.voucherConsumed&&!l.voucherGranted)fail('invalid-last-resort');
 for(const h of s.economy.history)if(!object(h)||typeof h.id!=='string'||!h.id.trim()||!['reward','purchase','repair'].includes(h.kind)||!Number.isSafeInteger(h.amount)||h.amount<=0||h.amount>MAX_BALANCE||!int(h.revision)||h.revision>s.revision||!int(h.balance,MAX_BALANCE))fail('invalid-history');
 return s;
}

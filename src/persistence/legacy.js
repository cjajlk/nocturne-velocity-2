import {SHIPS,WEAPONS,DRONES} from '../content.js';
import {normalize,SAVE_KEY} from '../storage.js';
import {normalizePreferences,PREFERENCES_KEY} from '../preferences.js';
import {decodeProgress,PROGRESS_KEY} from '../progression/storage.js';
import {fail} from './errors.js';
export const LEGACY_KEYS=Object.freeze([SAVE_KEY,PREFERENCES_KEY,PROGRESS_KEY]);
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const number=(v,max)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
export function validateLegacy(key,raw){
 if(raw===null)return null;
 let value;try{value=JSON.parse(raw);}catch{fail('legacy-corrupt:'+key);}
 if(!object(value))fail('legacy-corrupt:'+key);
 if(key===SAVE_KEY){
  if(value.version!==1)fail('legacy-version:'+key);
  if(!['ship','weapon','drone','credits','best'].every(k=>Object.hasOwn(value,k)))fail('legacy-ambiguous:'+key);
  for(const [field,catalog] of Object.entries({ship:SHIPS,weapon:WEAPONS,drone:DRONES}))if(field in value&&!Object.hasOwn(catalog,value[field]))fail('legacy-invalid:'+key);
  for(const field of ['credits','best'])if(field in value&&!number(value[field],1e9))fail('legacy-invalid:'+key);
 }else if(key===PREFERENCES_KEY){
  if('version'in value&&value.version!==1)fail('legacy-version:'+key);
  if(!['enabled','volume','difficulty'].every(k=>Object.hasOwn(value,k)))fail('legacy-ambiguous:'+key);
  if('enabled'in value&&typeof value.enabled!=='boolean'||'volume'in value&&(!Number.isFinite(value.volume)||value.volume<0||value.volume>1)||'difficulty'in value&&!['easy','normal','hard'].includes(value.difficulty))fail('legacy-invalid:'+key);
 }else if(key===PROGRESS_KEY){const decoded=decodeProgress(raw);if(decoded.readOnly)fail('legacy-'+decoded.status+':'+key);}
 return value;
}
export function readHistorical(storage){
 const raw={};for(const key of LEGACY_KEYS){raw[key]=storage.getItem(key);if(raw[key]!==null&&typeof raw[key]!=='string')fail('legacy-ambiguous:'+key);validateLegacy(key,raw[key]);}
 return {raw,profile:normalize(raw[SAVE_KEY]===null?null:JSON.parse(raw[SAVE_KEY])),preferences:normalizePreferences(raw[PREFERENCES_KEY]===null?null:JSON.parse(raw[PREFERENCES_KEY]))};
}
export const sameRaw=(a,b)=>LEGACY_KEYS.every(key=>a[key]===b[key]);

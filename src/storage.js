import {SHIPS,WEAPONS,DRONES} from './content.js';
export const SAVE_KEY='nv2_save_v1';
const bounded=n=>Number.isFinite(n)?Math.max(0,Math.min(1e9,Math.floor(n))):0;
export function normalize(s){
 s=s && typeof s==='object' && s.version===1?s:{};
 return {version:1,ship:Object.hasOwn(SHIPS,s.ship)?s.ship:'revenant',weapon:Object.hasOwn(WEAPONS,s.weapon)?s.weapon:'flux',drone:Object.hasOwn(DRONES,s.drone)?s.drone:'none',credits:bounded(s.credits),best:bounded(s.best)};
}
export function load(storage){try{return normalize(JSON.parse(storage.getItem(SAVE_KEY)));}catch{return normalize(null);}}
export function save(storage,state){try{storage.setItem(SAVE_KEY,JSON.stringify(normalize(state)));return true;}catch{return false;}}

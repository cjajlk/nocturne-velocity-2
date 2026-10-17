import {DIFFICULTIES} from './difficulty.js';
export const PREFERENCES_KEY='nv2_preferences_v1';
export function normalizePreferences(value){const s=value&&typeof value==='object'?value:{};return {enabled:typeof s.enabled==='boolean'?s.enabled:true,volume:Number.isFinite(s.volume)?Math.max(0,Math.min(1,s.volume)):.65,difficulty:Object.hasOwn(DIFFICULTIES,s.difficulty)?s.difficulty:'normal'};}
export function loadPreferences(storage){try{return normalizePreferences(JSON.parse(storage.getItem(PREFERENCES_KEY)));}catch{return normalizePreferences(null);}}
export function savePreferences(storage,prefs){try{storage.setItem(PREFERENCES_KEY,JSON.stringify(normalizePreferences(prefs)));return true;}catch{return false;}}

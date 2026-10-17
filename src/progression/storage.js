import {PREREQUISITES,systemById,INITIAL_DESTINATIONS} from '../galaxy/catalog.js';
import {createInitialProgress,advanceProgress} from '../galaxy/unlocks.js';

export const PROGRESS_KEY='nv2_progress_v1';
const copy=s=>({version:1,unlockedDestinations:[...s.unlockedDestinations],accomplishments:[...s.accomplishments]});
export function decodeProgress(raw){
 const fallback=status=>({status,state:createInitialProgress(),raw,readOnly:status!=='absent'});
 if(raw===null)return fallback('absent');
 let value;try{value=JSON.parse(raw);}catch{return fallback('corrupt');}
 if(!value||typeof value!=='object'||Array.isArray(value))return fallback('corrupt');
 if(value.version!==1)return fallback('incompatible');
 if(!Array.isArray(value.unlockedDestinations)||!Array.isArray(value.accomplishments)||[...value.unlockedDestinations,...value.accomplishments].some(id=>typeof id!=='string'))return fallback('corrupt');
 if(Object.keys(value).some(k=>!['version','unlockedDestinations','accomplishments'].includes(k))||value.unlockedDestinations.some(id=>!systemById(id))||value.accomplishments.some(id=>!Object.hasOwn(PREREQUISITES,id)))return fallback('incompatible');
 return {status:'valid',raw,readOnly:false,state:{version:1,unlockedDestinations:[...new Set([...INITIAL_DESTINATIONS,...value.unlockedDestinations])],accomplishments:[...new Set(value.accomplishments)]}};
}
export function createProgressStore(storage,{onIssue=()=>{}}={}){
 let loaded;try{loaded=decodeProgress(storage.getItem(PROGRESS_KEY));}catch{loaded={status:'unavailable',state:createInitialProgress(),raw:null,readOnly:true};}
 let state=loaded.state,raw=loaded.raw,status=loaded.status,readOnly=loaded.readOnly,dirty=status==='absent',issue=null;
 function report(code){issue=code;onIssue(code);}
 if(readOnly)report(status);
 function flush(){
  if(readOnly)return false;
  if(!dirty)return true;
  let current;try{current=storage.getItem(PROGRESS_KEY);}catch{readOnly=true;report('read-failed');return false;}
  // Détection de divergence, sans prétendre fournir une transaction multi-onglets.
  if(current!==raw){readOnly=true;report('conflict');return false;}
  const next=JSON.stringify(state);
  try{storage.setItem(PROGRESS_KEY,next);}catch{report('write-failed');return false;}
  raw=next;status='valid';dirty=false;issue=null;return true;
 }
 return {
  get state(){return copy(state);},
  get diagnostics(){return {status,readOnly,dirty,issue};},
  get preservedRaw(){return raw;},
  initialize:flush,
  flush,
  recordValidatedAccomplishments(ids){
   if(readOnly)return {changed:false,persisted:false,reason:issue||status};
   if(!Array.isArray(ids)||ids.some(id=>typeof id!=='string'||!Object.hasOwn(PREREQUISITES,id))){report('invalid-accomplishment');return {changed:false,persisted:false,reason:'invalid-accomplishment'};}
   const fresh=ids.filter(id=>!state.accomplishments.includes(id));
   if(fresh.some(id=>!PREREQUISITES[id].implemented)){report('unavailable-prerequisite');return {changed:false,persisted:false,reason:'unavailable-prerequisite'};}
   if(!fresh.length)return {changed:false,persisted:!dirty,reason:null};
   const next=advanceProgress(state,fresh);state=next;dirty=true;
   return {changed:true,persisted:flush(),reason:issue};
  }
 };
}

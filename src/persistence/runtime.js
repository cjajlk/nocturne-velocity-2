import {TRANSITION_KEY,sourceDigest,readTransition,writeTransition,sameTransition} from './transition.js';
import {initialState,validateState} from './schema.js';
import {readHistorical,sameRaw,LEGACY_KEYS,validateLegacy} from './legacy.js';
import {openDatabase,transaction} from './database.js';
import {storageError,fail} from './errors.js';
async function initializeLocked({indexedDB,storage,name,onIssue=()=>{},signal}={}){
 let blocked=false,issue=null,db;
 function block(code){blocked=true;issue=code;onIssue(code);}
 try{
  // An unreadable/corrupt source is never silently normalized into a new wallet.
  const before=readHistorical(storage);
  db=await openDatabase(indexedDB,{name,onObsolete:block});
  const digest=await sourceDigest(before.raw);let transition=readTransition(storage);
  if(!transition){transition={version:1,phase:'prepared',token:crypto.randomUUID(),digest};writeTransition(storage,transition);}
  if(transition.phase==='prepared'&&transition.digest!==digest)fail('migration-conflict');
  const state=await transaction(db,['state','meta','operations'],'readwrite',c=>{
   const request=c.store.get('root');request.onsuccess=()=>{const marker=c.tx.objectStore('meta').get('migration');marker.onsuccess=()=>{try{
    const now=readHistorical(storage);if(!sameRaw(before.raw,now.raw))fail('migration-conflict');
    if(!sameTransition(transition,readTransition(storage)))fail('transition-conflict');
    if(request.result!==undefined){if(marker.result?.token!==transition.token)fail('transition-conflict');if(marker.result?.version!==1||typeof marker.result?.complete!=='boolean'||marker.result?.id!=='legacy-v1')fail('invalid-migration-marker');validateState(request.result);if(!marker.result.complete&&!sameRaw(request.result.migration.raw,before.raw))fail('migration-conflict');c.result(request.result);return;}
    if(marker.result!==undefined||transition.phase==='committed')fail('missing-authoritative-state');
    const next=initialState(now);validateState(next);
    if(!sameRaw(now.raw,readHistorical(storage).raw))fail('migration-conflict');
    const count=c.tx.objectStore('operations').count();count.onsuccess=()=>{try{if(count.result)fail('missing-authoritative-state');c.store.add(next,'root');c.tx.objectStore('meta').add({version:1,complete:false,id:'legacy-v1',token:transition.token},'migration');c.result(next);}catch(e){c.fail(e);}};
   }catch(e){c.fail(e);}};};
  },{signal});
  // An intervening legacy writer causes a controlled stop; never a second import.
  if(!sameRaw(before.raw,readHistorical(storage).raw))fail('migration-conflict-after-commit');
  if(!sameTransition(transition,readTransition(storage)))fail('transition-conflict');
  if(transition.phase==='prepared'){transition={...transition,phase:'committed'};writeTransition(storage,transition);}
  // A prepared import is unreadable by the wallet until the source recheck completes.
  // If the tab closes here, identical sources can finalize it without reimporting.
  await transaction(db,['meta'],'readwrite',c=>{
   const marker=c.store.get('migration');marker.onsuccess=()=>{try{
    if(!sameRaw(before.raw,readHistorical(storage).raw))fail('migration-conflict');
    if(marker.result?.version!==1||marker.result?.id!=='legacy-v1'||marker.result?.token!==transition.token)fail('invalid-migration-marker');
    if(!sameTransition(transition,readTransition(storage)))fail('transition-conflict');
    if(!marker.result.complete)c.store.put({...marker.result,complete:true},'migration');
    c.result(true);
   }catch(e){c.fail(e);}};
  },{signal});
  let expected={...before.raw};
  const foreignChange=event=>{if(event.storageArea===storage&&(event.key===null||event.key===TRANSITION_KEY||LEGACY_KEYS.includes(event.key)&&event.newValue!==expected[event.key]))block('legacy-conflict');};
  globalThis.addEventListener?.('storage',foreignChange);
  const guardedStorage={
   getItem(key){
    if(blocked)fail(issue||'writes-blocked');if(!sameTransition(transition,readTransition(storage))){block('transition-conflict');fail('transition-conflict');}if(!LEGACY_KEYS.includes(key))fail('unsupported-key');
    try{const value=storage.getItem(key);validateLegacy(key,value);if(value!==expected[key])fail('legacy-conflict');return value;}
    catch(e){block(e.code||'legacy-read-failed');throw e;}
   },
   setItem(key,value){
    if(blocked)fail(issue||'writes-blocked');
    if(!sameTransition(transition,readTransition(storage))){block('transition-conflict');fail('transition-conflict');}
    if(!LEGACY_KEYS.includes(key)||typeof value!=='string')fail('unsupported-key');
    try{
     const current=storage.getItem(key);validateLegacy(key,current);validateLegacy(key,value);
     if(current!==expected[key])fail('legacy-conflict');
     if(key==='nv2_save_v1'){
      const old=current===null?null:JSON.parse(current),next=JSON.parse(value);
      // This field is a historical mirror, never a path back into the wallet.
      next.credits=old?.credits??state.migration.profile.credits;
      value=JSON.stringify({...old,...next});
     }else if(key==='nv2_preferences_v1')value=JSON.stringify({...(current===null?{}:JSON.parse(current)),...JSON.parse(value)});
     storage.setItem(key,value);
     if(storage.getItem(key)!==value)fail('legacy-write-unconfirmed');
     expected[key]=value;
    }catch(e){block(e.code||'legacy-write-failed');throw e;}
   }
  };
  return Object.freeze({storage:guardedStorage,get blocked(){return blocked;},get diagnostics(){return {ready:!blocked,blocked,issue,revision:state.revision};},balance:()=>state.economy.balance,close(){globalThis.removeEventListener?.('storage',foreignChange);block('closed');db.close();}});
 }catch(e){db?.close();const error=storageError(e);block(error.code);throw error;}
}

export async function initializePersistence(options={}){
 if(!globalThis.navigator?.locks?.request)fail('migration-lock-unavailable');
 return navigator.locks.request('nv2-migration:'+(options.name||'nv2_persistence_v1'),()=>initializeLocked(options));
}

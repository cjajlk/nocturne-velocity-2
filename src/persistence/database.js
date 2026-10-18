import {PersistenceError,storageError} from './errors.js';
// Any future incompatible writer protocol must also bump DATABASE_VERSION.
// versionchange invalidates all cooperating connections before the upgrade.
export const DATABASE='nv2_persistence_v1',DATABASE_VERSION=1;
export function openDatabase(indexedDB,{name=DATABASE,onObsolete=()=>{},timeout=5000}={}){
 return new Promise((resolve,reject)=>{
  if(!indexedDB){reject(new PersistenceError('indexeddb-unavailable'));return;}
  let request,finished=false;
  const timer=setTimeout(()=>finish(new PersistenceError('database-blocked')),timeout);
  const finish=(error,db)=>{if(finished){db?.close();return;}finished=true;clearTimeout(timer);error?reject(storageError(error)):resolve(db);};
  try{request=indexedDB.open(name,DATABASE_VERSION);}catch(e){finish(e);return;}
  request.onupgradeneeded=()=>{const db=request.result;if(request.transaction.db.version!==1){request.transaction.abort();return;}for(const store of ['state','operations','meta'])if(!db.objectStoreNames.contains(store))db.createObjectStore(store);};
  request.onerror=()=>finish(request.error);
  request.onblocked=()=>finish(new PersistenceError('database-blocked'));
  request.onsuccess=()=>{const db=request.result;if(!['state','operations','meta'].every(s=>db.objectStoreNames.contains(s))){db.close();finish(new PersistenceError('invalid-database'));return;}db.onversionchange=()=>{db.close();onObsolete('obsolete-version');};db.onclose=()=>onObsolete('database-closed');finish(null,db);};
 });
}
// Results are published only on transaction completion, never on request success.
export function transaction(db,stores,mode,work,{signal}={}){
 return new Promise((resolve,reject)=>{
  let tx,result,error;
  const abort=()=>{error=new PersistenceError('transaction-aborted');try{tx.abort();}catch{}};
  try{tx=db.transaction(stores,mode,{durability:mode==='readwrite'?'strict':'default'});}catch(e){reject(storageError(e));return;}
  tx.oncomplete=()=>{signal?.removeEventListener('abort',abort);resolve(structuredClone(result));};
  tx.onabort=()=>{signal?.removeEventListener('abort',abort);reject(storageError(error||tx.error||new PersistenceError('transaction-aborted')));};
  tx.onerror=()=>{};
  const context={tx,get store(){return tx.objectStore(stores[0]);},result(value){result=value;},fail(e){error??=e;try{tx.abort();}catch{}}};
  if(signal?.aborted){abort();return;}signal?.addEventListener('abort',abort,{once:true});
  try{work(context);}catch(e){context.fail(e);}
 });
}

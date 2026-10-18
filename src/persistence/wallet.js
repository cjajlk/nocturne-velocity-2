import {openDatabase,transaction} from './database.js';
import {validateState,MAX_BALANCE} from './schema.js';
import {fail,PersistenceError} from './errors.js';
function readState(context,accept){
 const request=context.store.get('root');
 request.onsuccess=()=>{
  const marker=context.tx.objectStore('meta').get('migration');
  marker.onsuccess=()=>{try{
   if(marker.result?.version!==1||marker.result?.complete!==true||marker.result?.id!=='legacy-v1')fail('invalid-migration-marker');
   accept(validateState(request.result));
  }catch(error){context.fail(error);}};
 };
}
// Preparatory service. No game module imports this API in this lot.
export async function openWallet({indexedDB,name,onIssue=()=>{}}={}){
 let obsolete=false;
 const db=await openDatabase(indexedDB,{name,onObsolete:code=>{obsolete=true;onIssue(code);}});
 const guard=()=>{if(obsolete)fail('obsolete-version');};
 async function read(){guard();return transaction(db,['state','meta'],'readonly',c=>readState(c,state=>c.result(state)));}
 async function execute({id,kind,amount},options={}){
  guard();
  if(typeof id!=='string'||!id.trim()||id.length>160||!['reward','purchase','repair'].includes(kind)||!Number.isSafeInteger(amount)||amount<=0||amount>MAX_BALANCE)throw new PersistenceError('invalid-operation');
  return transaction(db,['state','meta','operations'],'readwrite',c=>readState(c,state=>{
   const operations=c.tx.objectStore('operations'),prior=operations.get(id);
   prior.onsuccess=()=>{try{
    if(prior.result!==undefined){
     const p=prior.result;
     if(p.kind!==kind||p.amount!==amount||p.id!==id||!Number.isSafeInteger(p.balance)||p.balance<0||p.balance>MAX_BALANCE||!Number.isSafeInteger(p.revision)||p.revision<1||p.revision>state.revision)fail('transaction-id-conflict');
     c.result({...p,replayed:true});return;
    }
    const balance=state.economy.balance+(kind==='reward'?amount:-amount);
    if(balance<0)fail('insufficient-balance');
    if(balance>MAX_BALANCE||!Number.isSafeInteger(balance))fail('balance-capacity');
    if(state.revision===Number.MAX_SAFE_INTEGER)fail('revision-capacity');
    state.revision++;state.economy.balance=balance;
    const receipt={id,kind,amount,balance,revision:state.revision};
    state.economy.history.push(receipt);state.economy.history=state.economy.history.slice(-100);
    validateState(state);
    c.store.put(state,'root');operations.add(receipt,id);
    c.result({...receipt,replayed:false});
   }catch(error){c.fail(error);}};
  }),options);
 }
 return Object.freeze({read,balance:async()=>(await read()).economy.balance,execute,reward:(id,amount,options)=>execute({id,kind:'reward',amount},options),purchase:(id,amount,options)=>execute({id,kind:'purchase',amount},options),repair:(id,amount,options)=>execute({id,kind:'repair',amount},options),close:()=>db.close()});
}

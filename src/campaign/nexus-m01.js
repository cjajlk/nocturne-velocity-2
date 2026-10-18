import {update} from '../combat.js';
import {createEnemy,updateEnemies} from '../enemies.js';
import {createSession} from '../session.js';
import {createDefenseRun,createDefenseScenario,addBomber,stopDefenseRun} from '../defense/simulation.js';
import {BREAKER,M01_LIMITS,M01_LABELS,M01_PLAN,missionSchedule} from './nexus-m01-config.js';
const controllers=new WeakMap();
const isBomber=e=>!!e.defenseBomber;
function controller(s){
 const defense=createDefenseScenario(s),difficulty=['easy','normal','hard'].includes(s.loadout.difficulty)?s.loadout.difficulty:'normal';
 let phase=1,elapsed=0,queue=missionSchedule(difficulty,1),actors=[],history=[],outcome=null,breakerSpawned=false,breakerDestroyed=false,bomberSerial=0,lastBomberAt=-Infinity;
 const resolved=[];
 function enter(next){
  if(phase)history.push({phase,completedAt:s.t,nexus:s.nexus.state.integrity,remainingEnemies:s.enemies.length,remainingHostile:s.hostile.length});
  phase=next;elapsed=0;queue=missionSchedule(difficulty,phase);actors=[];s.phase=`0${phase} / ${M01_LABELS[phase-1]}`;
 }
 s.phase='01 / '+M01_LABELS[0];
 function finish(reason){
  if(outcome)return false;
  outcome={reason,at:s.t,phase,nexus:s.nexus.state.integrity,armor:s.hp};
  s.over=true;s.victory=false; // Objectifs techniques seulement : aucun résultat de campagne.
  s.phase=reason==='objectives_met'?'OBJECTIFS ACCOMPLIS / NON VALIDÉS':reason==='defeat_nexus'?'NEXUS DÉTRUITE':reason==='defeat_player'?'BLINDAGE ÉPUISÉ':'TEST ABANDONNÉ';
  queue=[];actors=[];stopDefenseRun(s);return true;
 }
 function spawn(item){
  const capacity=M01_LIMITS.enemies-s.enemies.length;
  if(item.kind==='formation'){
   if(capacity<3)return false;
   const center=s.width*(item.group%2?.65:.35);
   for(let slot=-1;slot<=1;slot++){
    const e=createEnemy(s,'fighter',{slot,group:item.group,center,x:center+slot*68,y:-80-Math.abs(slot)*35,cooldown:2.1+(slot+1)*.35});
    s.enemies.push(e);actors.push({e,kind:'fighter',phase});
   }
  }else if(item.kind==='breaker'){
   if(capacity<1||breakerSpawned)return false;
   const e=createEnemy(s,'heavy',{hp:BREAKER.hp,maxHp:BREAKER.hp,size:BREAKER.size,r:BREAKER.r,center:s.width/2,x:s.width/2,y:-BREAKER.size,cooldown:2,breaker:true});
   s.enemies.push(e);actors.push({e,kind:'breaker',phase});breakerSpawned=true;
  }else{
   if(capacity<1||s.nexus.state.activeBombers>=M01_LIMITS.bombers||s.t-lastBomberAt<M01_PLAN[difficulty][phase-2].interval-1e-9)return false;
   const occupied=s.enemies.filter(isBomber).map(e=>e.defenseBomber.lane);
   const lanes=bomberSerial%2?[.75,.25,.5]:[.25,.75,.5];
   const lane=lanes.find(x=>occupied.every(other=>Math.abs(x-other)>.2));
   const e=addBomber(s,item.kind,lane??.5);
   if(!e)return false;bomberSerial++;lastBomberAt=s.t;actors.push({e,kind:item.kind,phase});
  }
  return true;
 }
 function reconcile(){
  for(const a of actors){if(a.resolution)continue;
   const e=a.e;
   if(isBomber(e))a.resolution=e.defenseBomber.resolution;
   else if(e.hp<=0)a.resolution='destroyed';
   else if(!s.enemies.includes(e)&&a.kind!=='breaker')a.resolution='escaped';
   if(a.resolution){resolved.push({id:e.id,kind:a.kind,phase:a.phase,resolution:a.resolution,at:s.t});if(a.kind==='breaker'&&a.resolution==='destroyed')breakerDestroyed=true;}
  }
 }
 return {
  scenario:{...defense,
   spawn(_s,dt){elapsed+=dt;while(queue.length&&elapsed>=queue[0].at){if(!spawn(queue[0]))break;queue.shift();}},
   move(_s,dt){defense.move(s,dt);
    // L'IA historique ne voit que les chasseurs et le lourd ; les bombardiers restent sous contrôle du lot 2A.
    const all=s.enemies;s.enemies=all.filter(e=>!isBomber(e));try{updateEnemies(s,dt);}finally{s.enemies=all;}
   }
  },
  get finished(){return !!outcome;},
  after(){
   reconcile();
   // Une défaite prime sur les objectifs si les deux surviennent au même pas.
   if(s.nexus.state.destroyed){finish('defeat_nexus');return;}
   if(s.hp<=0){finish('defeat_player');return;}
   if(s.over){finish('abandoned');return;}
   if(queue.length||actors.some(a=>!a.resolution)||s.enemies.length||s.hostile.length)return;
   if(phase<3)enter(phase+1);
   else if(breakerDestroyed){history.push({phase,completedAt:s.t,nexus:s.nexus.state.integrity,remainingEnemies:0,remainingHostile:0});finish('objectives_met');}
  },finish,
  snapshot(){return {id:'nexus_m01',phase,label:M01_LABELS[phase-1],elapsed,pending:queue.length,active:actors.filter(a=>!a.resolution).length,announcement:phase===3&&!breakerSpawned&&!outcome?'LE BRISEUR EN APPROCHE':null,breakerSpawned,breakerDestroyed,outcome:outcome?{...outcome}:null,history:history.map(v=>({...v})),resolved:resolved.map(v=>({...v})),plannedDifficulty:difficulty};}
 };
}
export function createNexusMissionRun(loadout){const s=createDefenseRun(loadout);controllers.set(s,controller(s));return s;}
export const nexusMissionState=s=>controllers.get(s)?.snapshot()??null;
export function updateNexusMission(s,dt,input={}){
 const c=controllers.get(s);if(!c||c.finished||s.nexus.state.closed||s.nexus.state.paused||!Number.isFinite(dt)||dt<=0||dt>.2)return;
 if(s.hp<=0||s.nexus.state.destroyed||s.over){c.after();return;}
 let left=dt;while(left>1e-10&&!s.over){const step=Math.min(1/120,left);s.nexus.tick(step);update(s,step,input,c.scenario);c.after();left-=step;}
}
export function createNexusMissionSession(){
 const base=createSession({makeRun:createNexusMissionRun,advance:updateNexusMission});
 const end=()=>{if(base.run)controllers.get(base.run)?.finish('abandoned');};
 return {
  get run(){return base.run;},get paused(){return base.paused;},get launching(){return base.launching;},get revision(){return base.revision;},
  start:(...args)=>base.start(...args),cancelStart:()=>base.cancelStart(),active:(...args)=>base.active(...args),step:(...args)=>base.step(...args),
  pause(){const changed=base.pause();if(changed)base.run.nexus.suspend();return changed;},
  resume(){const changed=base.resume();if(changed)base.run.nexus.resume();return changed;},
  end,abandon(){end();base.abandon();},takeResult:()=>null
 };
}

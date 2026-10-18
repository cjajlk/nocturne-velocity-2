import {createRun,update,setBounds,damageEnemy} from '../combat.js';
import {createEnemy} from '../enemies.js';
import {createSession} from '../session.js';
import {LIMITS} from '../content.js';
import {clamp} from '../core.js';
import {effect} from '../effects.js';
import {BOMBERS,DEFENSE_LIMIT,flightRate} from './config.js';
import {createNexusDefense} from './nexus.js';
import {sweptShot} from './collisions.js';
const scenarios=new WeakMap();
const bomber=e=>!!e.defenseBomber;
const position=(s,e)=>{e.x=s.width*e.defenseBomber.lane;e.y=-e.size+(s.height*DEFENSE_LIMIT+e.size)*e.defenseBomber.progress;};
export function createDefenseRun(loadout){const s=createRun(loadout);s.nexus=createNexusDefense();s.phase='TEST TECHNIQUE / DÉFENSE';scenarios.set(s,createDefenseScenario(s));return s;}
export function addBomber(s,kind,lane=.5){
 if(!s.nexus||s.over||!Object.hasOwn(BOMBERS,kind)||!Number.isFinite(lane)||s.enemies.length>=LIMITS.enemies)return null;
 const spec=BOMBERS[kind],e=createEnemy(s,spec.type,{x:0,y:0,hp:spec.hp,maxHp:spec.hp,defenseBomber:{kind,lane:clamp(lane,.12,.88),progress:0,rate:flightRate(kind),resolution:null}});
 if(!s.nexus.register(e.id,kind))return null;position(s,e);s.enemies.push(e);return e;
}
export function setDefenseBounds(s,width,height){if(!(width>0&&height>0))return;setBounds(s,width,height);for(const e of s.enemies)if(bomber(e))position(s,e);}
export function stopDefenseRun(s){if(!s)return;s.nexus.end();s.enemies=[];s.bullets=[];s.hostile=[];s.events=[];s.effects=[];s.particles=[];s.vx=s.vy=0;s.ending=null;scenarios.delete(s);}
export function createDefenseScenario(s){
 let enemies=[],shots=[];
 return {
  handles:bomber,
  snapshot(){
   enemies=s.enemies.filter(bomber).map(e=>({e,x:e.x,y:e.y,p:e.defenseBomber.progress}));
   shots=s.bullets.map((b,i)=>({b,i,x:b.x,y:b.y,life:b.life}));
   for(const {e} of enemies)if(e.hp<=0&&!e.defenseBomber.resolution){e.defenseBomber.resolution='destroyed';s.nexus.destroyed(e.id);}
  },
  move(_s,dt){for(const {e} of enemies){if(e.hp<=0||e.defenseBomber.resolution)continue;e.age+=dt;e.hitFlash=Math.max(0,e.hitFlash-dt);e.defenseBomber.progress+=e.defenseBomber.rate*dt;position(s,e);if(e.defenseBomber.progress>=.76)s.nexus.approach(e.id);}},
  resolve(_s,dt){
   const events=[];
   for(const previous of enemies){const {e}=previous;if(e.hp<=0||e.defenseBomber.resolution)continue;const p=e.defenseBomber.progress;
    if(p>=1){const time=previous.p>=1?0:(1-previous.p)/(p-previous.p);events.push({time,priority:0,e});}
    for(const shot of shots){const {b}=shot;if(b.dead||shot.life<=0)continue;const time=sweptShot(shot,b,previous,e,e.r);if(time<=Math.min(1,shot.life/dt))events.push({time,priority:1,e,b,index:shot.i});}
   }
   events.sort((a,b)=>Math.abs(a.time-b.time)>1e-9?a.time-b.time:a.priority-b.priority||a.e.id-b.e.id||(a.index??0)-(b.index??0));
   for(const event of events){const {e,b}=event;if(s.over||s.nexus.state.destroyed)break;if(e.hp<=0||e.defenseBomber.resolution)continue;
    if(event.priority===0){if(s.nexus.crossing(e.id)){e.defenseBomber.resolution='crossed';e.resolved=true;}if(s.nexus.state.destroyed){s.over=true;s.victory=false;s.phase='NEXUS DÉTRUITE / FIN DU TEST';}continue;}
    if(b.dead)continue;if(damageEnemy(s,e,b.damage,b.owner)){b.dead=true;effect(s,'impact',b.x,b.y,b.kind==='missile'?48:25);if(e.hp<=0){e.defenseBomber.resolution='destroyed';s.nexus.destroyed(e.id);}}
   }
  }
 };
}
export function updateDefenseRun(s,dt,input={}){
 if(!s.nexus)return;
 if(s.over){stopDefenseRun(s);return;}
 if(s.nexus.state.closed||s.nexus.state.paused||!Number.isFinite(dt)||dt<=0||dt>.2)return;
 if(s.hp<=0||s.nexus.state.destroyed){s.over=true;s.victory=false;stopDefenseRun(s);return;}
 let left=dt;while(left>1e-10&&!s.over){const step=Math.min(1/120,left);s.nexus.tick(step);update(s,step,input,scenarios.get(s));left-=step;}
 if(s.over)stopDefenseRun(s);
}
export function createDefenseSession(){
 const base=createSession({makeRun:createDefenseRun,advance:updateDefenseRun});
 return {
  get run(){return base.run;},get paused(){return base.paused;},get launching(){return base.launching;},get revision(){return base.revision;},
  start(loadout,prepare){if(base.run?.over)stopDefenseRun(base.run);return base.start(loadout,prepare);},cancelStart:()=>base.cancelStart(),active:(visible,foreground)=>base.active(visible,foreground),
  step(...args){if(base.run?.over)stopDefenseRun(base.run);base.step(...args);},
  end(){if(base.run){base.run.over=true;base.run.victory=false;stopDefenseRun(base.run);}},
  pause(){const changed=base.pause();base.run?.nexus.suspend();return changed;},
  resume(){const changed=base.resume();if(changed)base.run?.nexus.resume();return changed;},
  abandon(){stopDefenseRun(base.run);base.abandon();},
  // Un test technique ne produit jamais de résultat de mission ni de récompense.
  takeResult:()=>null
 };
}

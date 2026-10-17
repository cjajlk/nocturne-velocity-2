import {emit} from './events.js';
import {ENEMY,LIMITS} from './content.js';
import {clamp} from './core.js';
export function createEnemy(s,type,options={}){
 const spec=ENEMY[type];
 return {id:++s.serial,type,...spec,maxHp:spec.hp,x:s.width/2,y:-100,boss:type==='spectra',age:0,cooldown:2,warning:null,hitFlash:0,bank:0,phase:1,phaseFlash:0,attackIndex:0,...options};
}
function add(s,type,options){if(s.enemies.length<LIMITS.enemies)s.enemies.push(createEnemy(s,type,options));}
const WAVES=[{at:.6,type:'fighter'},{at:4.6,type:'fighter'},{at:8.6,type:'fighter'},
 {at:12.5,type:'interceptor'},{at:16.5,type:'interceptor'},{at:20.5,type:'interceptor'},
 {at:24.5,type:'heavy'},{at:29,type:'heavy'},{at:33.5,type:'heavy'}];
// Même effectif (18 ennemis), davantage de chevauchement en Normal/Difficile.
const PRESSURE_TIMES=[.6,4,7.4,10.8,14.2,17.6,21.5,26,29.5];
export function bossPattern(phase,index){
 const deck=phase===1?['fan']:phase===2?['split','fan','columns','fan']:['split','columns','fan','columns','fan'];
 return deck[index%deck.length];
}
export function spawnWaves(s){
 const pressure=!s.difficulty.trajectories;
 while(s.waveIndex<WAVES.length&&s.t>=(pressure?PRESSURE_TIMES[s.waveIndex]:WAVES[s.waveIndex].at)){
  const wave=WAVES[s.waveIndex],index=s.waveIndex++;
  if(wave.type==='fighter'){
   const center=s.width*(index%2?.62:.38);
   for(let slot=-1;slot<=1;slot++)add(s,'fighter',{slot,group:index,center,originX:center+slot*68,x:center+slot*68,y:-80-Math.abs(slot)*35,cooldown:(pressure?2.1:2.6)+(slot+1)*(pressure?.3:.4)});
  }else if(wave.type==='interceptor'){
   for(let i=0;i<2;i++){const side=(index+i)%2?1:-1;add(s,'interceptor',{side,x:side<0?-80:s.width+80,y:clamp(s.y-160-i*75,110,s.height*.58),originY:clamp(s.y-160-i*75,110,s.height*.58),cooldown:.8+i*.45});}
  }else add(s,'heavy',{center:s.width*([.3,.7,.5][index-6]),x:s.width*([.3,.7,.5][index-6]),y:-100,cooldown:2});
 }
 if(s.t>=(pressure?35:38)&&!s.bossSpawned){s.bossSpawned=true;s.hostile=[];for(const e of s.enemies){e.retreat=true;e.warning=null;}add(s,'spectra',{x:s.width/2,y:-150,cooldown:1.8});}
}
function aimAngle(s,e){return Math.atan2(s.y-e.y,s.x-e.x);}
export function warningAngles(w){
 if(w.pattern==='columns')return [];
 const offsets=w.pattern==='split'?[-.75,-.5,-.3,.3,.5,.75]:w.pattern==='heavy'?[-.32,0,.32]:w.pattern==='fan'?[-.2,0,.2]:[0];
 return offsets.map(a=>w.angle+a);
}
function warn(s,e,pattern,duration){
 // Cible figée dès l’annonce. Aucun tir ne suit le joueur à la dernière frame.
 const angle=aimAngle(s,e);
 duration=Math.max((e.boss||e.type==='heavy')?.65:.25,duration*s.difficulty.warningTime);
 e.warning={pattern,time:duration,duration,angle,aimX:s.x,aimY:s.y,columns:pattern==='columns'?[-120,0,120].map(offset=>clamp(s.x+offset,30,s.width-30)):[]};
 s.stats.warnings++;
}
function release(s,e){
 const w=e.warning;if(!w)return;
 const pressure=!s.difficulty.trajectories;
 const speed=(w.pattern==='columns'?220:e.boss?(pressure?[170,195,220][e.phase-1]:170):e.type==='heavy'?150:180)*s.difficulty.projectileSpeed;emit(s,e.boss?'spectra_fire':'enemy_fire',{x:e.x,gain:e.type==='heavy'?1.2:.55});
 const spawnProjectile=(x,y,vx,vy)=>{
  // Zone de sécurité : pas de projectile créé au contact du joueur.
  if(Math.hypot(x-s.x,y-s.y)<s.spec.r+110)return;
  if(s.hostile.length<LIMITS.hostile)s.hostile.push({x,y,vx,vy,r:w.pattern==='columns'?7:5,damage:e.type==='heavy'?18:e.boss?14:10,life:7,arm:.12,pattern:w.pattern,source:e.id,telegraphed:true});
 };
 if(w.pattern==='columns')for(const x of w.columns)spawnProjectile(x,e.y+e.r,0,speed);
 else for(const a of warningAngles(w))spawnProjectile(e.x,e.y+e.r*.7,Math.cos(a)*speed,Math.sin(a)*speed);
 s.stats.volleys++;e.warning=null;e.attackIndex++;e.cooldown=e.boss?(e.phase===3?1.25:1.75):e.type==='heavy'?3.3:e.type==='interceptor'?1.9:2.5;e.cooldown*=s.difficulty.cooldown;
 if(pressure)e.cooldown=(e.boss?[1.75,1.05,.65][e.phase-1]:e.type==='heavy'?2.65:e.type==='interceptor'?1.25:2)*s.difficulty.cooldown;
}
export function updateEnemies(s,dt){
 const pressure=!s.difficulty.trajectories;
 for(const e of s.enemies){
  e.age+=dt;e.hitFlash=Math.max(0,e.hitFlash-dt);e.phaseFlash=Math.max(0,e.phaseFlash-dt);
  if(e.hp<=0)continue;
  if(e.retreat){e.y-=200*dt;e.bank=0;e.warning=null;continue;}
  const prevX=e.x;
  if(e.type==='fighter'){
   e.state=e.age<3.2?'formation':'break';
   const direction=e.group%2?1:-1;
   if(e.state==='formation'){e.x=clamp(e.center+Math.sin(e.age*.9)*35+e.slot*68,30,s.width-30);e.y=-80-Math.abs(e.slot)*35+e.age*66;}
   else{e.x+=(direction*(pressure?55:80)+(pressure?Math.cos((e.age-3.2)*2.4+e.group)*65:0))*dt;e.y+=105*dt;}
  }else if(e.type==='interceptor'){
   e.state=e.age<1?'approach':e.age<3.9?'attack':'retreat';
   if(e.state==='approach')e.x+=-e.side*200*dt;
   else if(e.state==='attack'){e.x+=-e.side*(pressure?145:120)*dt;e.y=e.originY+Math.sin((e.age-1)*(pressure?2.6:2))*(pressure?50:35);}
   else{e.x+=e.side*230*dt;e.y-=90*dt;e.warning=null;}
  }else if(e.type==='heavy'){
   e.state=e.y<Math.min(155,s.height*.28)?'approach':'hold';
   if(e.state==='approach')e.y+=(pressure?66:52)*dt;
   else{e.x=e.center+Math.sin(e.age*.65)*(pressure?55:35);e.y+=Math.sin(e.age*.5)*5*dt;}
  }else{
   e.state=e.age<2.5?'enter':'combat';
   const ratio=e.hp/e.maxHp,next=ratio>.67?1:ratio>.34?2:3;
   if(next!==e.phase){e.phase=next;emit(s,'spectra_phase',{x:e.x});e.phaseFlash=1.1;e.warning=null;e.cooldown=1.3;s.hostile=[];s.stats.bossPhases.push(next);}
   if(e.state==='enter')e.y+=(145-e.y)*Math.min(1,dt*1.6);
   else e.y+=(145-e.y)*Math.min(1,dt*3);
   const orbit=s.width/2+Math.sin(e.age*(pressure?[.55,.85,1.1][e.phase-1]:e.phase===3?.9:.55))*Math.min(130,s.width*.17);
   // Les changements de fréquence entre phases ne téléportent jamais le boss.
   e.x=pressure?e.x+clamp(orbit-e.x,-[70,115,145][e.phase-1]*dt,[70,115,145][e.phase-1]*dt):orbit;
   s.phase=`SPECTRA / PHASE ${e.phase}`;
  }
  e.bank=clamp((e.x-prevX)/Math.max(dt,.001)/1000,-.18,.18);
  if(e.warning){e.warning.time-=dt;if(e.warning.time<=0)release(s,e);continue;}
  e.cooldown-=dt;
  if(e.cooldown>0||e.y<65||e.y>s.height-80||Math.hypot(e.x-s.x,e.y-s.y)<s.spec.r+145)continue;
  if(e.type==='interceptor'&&e.state!=='attack')continue;
  if(e.type==='heavy'&&e.state!=='hold')continue;
  if(e.boss&&e.state!=='combat')continue;
  // Un seul canal de salve lourde annoncé à la fois, pour laisser un couloir lisible.
  if((e.type==='heavy'||e.boss)&&s.enemies.some(other=>other!==e&&other.warning&&(other.type==='heavy'||other.boss)))continue;
  if(e.boss)warn(s,e,pressure?bossPattern(e.phase,e.attackIndex):e.phase===1?'fan':e.phase===2?'split':e.attackIndex%2?'columns':'split',e.phase===3?1.1:.95);
  else warn(s,e,e.type==='heavy'?'heavy':'single',e.type==='heavy'?1.1:e.type==='interceptor'?.65:.55);
 }
}

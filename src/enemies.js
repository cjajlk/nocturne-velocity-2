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
export function spawnWaves(s){
 while(s.waveIndex<WAVES.length&&s.t>=WAVES[s.waveIndex].at){
  const wave=WAVES[s.waveIndex],index=s.waveIndex++;
  if(wave.type==='fighter'){
   const center=s.width*(index%2?.62:.38);
   for(let slot=-1;slot<=1;slot++)add(s,'fighter',{slot,group:index,center,originX:center+slot*68,x:center+slot*68,y:-80-Math.abs(slot)*35,cooldown:2.6+(slot+1)*.4});
  }else if(wave.type==='interceptor'){
   for(let i=0;i<2;i++){const side=(index+i)%2?1:-1;add(s,'interceptor',{side,x:side<0?-80:s.width+80,y:clamp(s.y-160-i*75,110,s.height*.58),originY:clamp(s.y-160-i*75,110,s.height*.58),cooldown:.8+i*.45});}
  }else add(s,'heavy',{center:s.width*([.3,.7,.5][index-6]),x:s.width*([.3,.7,.5][index-6]),y:-100,cooldown:2});
 }
 if(s.t>=38&&!s.bossSpawned){s.bossSpawned=true;s.hostile=[];for(const e of s.enemies){e.retreat=true;e.warning=null;}add(s,'spectra',{x:s.width/2,y:-150,cooldown:1.8});}
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
 const speed=(w.pattern==='columns'?220:e.boss?170:e.type==='heavy'?150:180)*s.difficulty.projectileSpeed;emit(s,e.boss?'spectra_fire':'enemy_fire',{x:e.x,gain:e.type==='heavy'?1.2:.55});
 const spawnProjectile=(x,y,vx,vy)=>{
  // Zone de sécurité : pas de projectile créé au contact du joueur.
  if(Math.hypot(x-s.x,y-s.y)<s.spec.r+110)return;
  if(s.hostile.length<LIMITS.hostile)s.hostile.push({x,y,vx,vy,r:w.pattern==='columns'?7:5,damage:e.type==='heavy'?18:e.boss?14:10,life:7,arm:.12,pattern:w.pattern,source:e.id,telegraphed:true});
 };
 if(w.pattern==='columns')for(const x of w.columns)spawnProjectile(x,e.y+e.r,0,speed);
 else for(const a of warningAngles(w))spawnProjectile(e.x,e.y+e.r*.7,Math.cos(a)*speed,Math.sin(a)*speed);
 s.stats.volleys++;e.warning=null;e.attackIndex++;e.cooldown=e.boss?(e.phase===3?1.25:1.75):e.type==='heavy'?3.3:e.type==='interceptor'?1.9:2.5;e.cooldown*=s.difficulty.cooldown;
}
export function updateEnemies(s,dt){
 for(const e of s.enemies){
  e.age+=dt;e.hitFlash=Math.max(0,e.hitFlash-dt);e.phaseFlash=Math.max(0,e.phaseFlash-dt);
  if(e.hp<=0)continue;
  if(e.retreat){e.y-=200*dt;e.bank=0;e.warning=null;continue;}
  const prevX=e.x;
  if(e.type==='fighter'){
   e.state=e.age<3.2?'formation':'break';
   const direction=e.group%2?1:-1;
   if(e.state==='formation'){e.x=clamp(e.center+Math.sin(e.age*.9)*35+e.slot*68,30,s.width-30);e.y=-80-Math.abs(e.slot)*35+e.age*66;}
   else{e.x+=direction*80*dt;e.y+=105*dt;}
  }else if(e.type==='interceptor'){
   e.state=e.age<1?'approach':e.age<3.9?'attack':'retreat';
   if(e.state==='approach')e.x+=-e.side*200*dt;
   else if(e.state==='attack'){e.x+=-e.side*120*dt;e.y=e.originY+Math.sin((e.age-1)*2)*35;}
   else{e.x+=e.side*230*dt;e.y-=90*dt;e.warning=null;}
  }else if(e.type==='heavy'){
   e.state=e.y<Math.min(155,s.height*.28)?'approach':'hold';
   if(e.state==='approach')e.y+=52*dt;
   else{e.x=e.center+Math.sin(e.age*.65)*35;e.y+=Math.sin(e.age*.5)*5*dt;}
  }else{
   e.state=e.age<2.5?'enter':'combat';
   const ratio=e.hp/e.maxHp,next=ratio>.67?1:ratio>.34?2:3;
   if(next!==e.phase){e.phase=next;emit(s,'spectra_phase',{x:e.x});e.phaseFlash=1.1;e.warning=null;e.cooldown=1.3;s.hostile=[];s.stats.bossPhases.push(next);}
   if(e.state==='enter')e.y+=(145-e.y)*Math.min(1,dt*1.6);
   else e.y+=(145-e.y)*Math.min(1,dt*3);
   e.x=s.width/2+Math.sin(e.age*(e.phase===3?.9:.55))*Math.min(130,s.width*.17);
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
  if(e.boss)warn(s,e,e.phase===1?'fan':e.phase===2?'split':e.attackIndex%2?'columns':'split',e.phase===3?1.1:.95);
  else warn(s,e,e.type==='heavy'?'heavy':'single',e.type==='heavy'?1.1:e.type==='interceptor'?.65:.55);
 }
}

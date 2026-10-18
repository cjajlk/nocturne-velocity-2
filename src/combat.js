import {emit} from './events.js';
import {difficultyFor} from './difficulty.js';
import {SHIPS,NOVA} from './content.js';
import {W,H,clamp,circleRect} from './core.js';
import {effect,advanceEffects} from './effects.js';
import {bullet,firePlayer,advanceBullets} from './weapons.js';
import {spawnWaves,updateEnemies} from './enemies.js';
export function createRun(loadout){
 const spec=SHIPS[loadout.ship];
 return {loadout:{...loadout},spec,difficulty:difficultyFor(loadout.difficulty),events:[],width:W,height:H,t:0,x:W/2,y:H-100,vx:0,vy:0,hp:spec.hp,score:0,kills:0,shot:0,switchLock:0,invincible:0,novaCharge:0,novaOrigin:null,pulse:0,damageFlash:0,shake:0,droneAngle:0,droneShot:0,bullets:[],enemies:[],hostile:[],effects:[],particles:[],bossSpawned:false,over:false,victory:false,ending:null,phase:'CONTACT',serial:0,waveIndex:0,
 stats:{shots:0,playerKills:0,droneKills:0,novaKills:0,escaped:0,damageTaken:0,warnings:0,volleys:0,novaUses:0,bossNovaDamage:0,bossPhases:[1]}};
}
export function setBounds(s,width,height){
 const rx=width/s.width,ry=height/s.height;s.x*=rx;s.y*=ry;s.vx*=rx;s.vy*=ry;
 for(const list of [s.enemies,s.bullets,s.hostile,s.effects,s.particles])for(const item of list){item.x*=rx;item.y*=ry;if(item.center!==undefined)item.center*=rx;if(item.originY!==undefined)item.originY*=ry;if(item.trail)item.trail=[];if(item.warning){item.warning.aimX*=rx;item.warning.aimY*=ry;item.warning.columns=item.warning.columns.map(x=>x*rx);item.warning.angle=Math.atan2(item.warning.aimY-item.y,item.warning.aimX-item.x);}}
 if(s.novaOrigin){s.novaOrigin.x*=rx;s.novaOrigin.y*=ry;}if(s.ending){s.ending.x*=rx;s.ending.y*=ry;}
 s.width=width;s.height=height;
}
export function damageEnemy(s,e,amount,owner){
 if(e.hp<=0||amount<=0)return false;
 if(e.boss&&e.state==='enter')return false;
 e.hp-=amount;e.hitFlash=.085;emit(s,'armor_hit',{x:e.x,gain:.65});
 if(e.hp<=0)e.destroyedBy=owner;
 return true;
}
export function nova(s){
 if(s.over||s.ending||s.novaCharge<100)return false;
 emit(s,'nova');s.novaCharge=0;s.pulse=.65;s.novaOrigin={x:s.x,y:s.y};s.stats.novaUses++;
 s.hostile=s.hostile.filter(b=>Math.hypot(b.x-s.x,b.y-s.y)>NOVA.radius);
 for(const e of s.enemies)if(Math.hypot(e.x-s.x,e.y-s.y)<=NOVA.radius+e.r){const amount=e.boss?Math.min(NOVA.bossDamage,e.maxHp*.04):NOVA.damage;if(damageEnemy(s,e,amount,'nova')&&e.boss)s.stats.bossNovaDamage+=amount;}
 return true;
}
function movePlayer(s,dt,input){
 let dx=input.dx||0,dy=input.dy||0;let speed=s.spec.speed;
 if(input.target){dx=input.target.x-s.x;dy=input.target.y-s.y;const distance=Math.hypot(dx,dy);speed=Math.min(speed,distance*9);}
 const length=Math.hypot(dx,dy),targetX=length?dx/Math.max(1,length)*speed:0,targetY=length?dy/Math.max(1,length)*speed:0;
 const deltaX=targetX-s.vx,deltaY=targetY-s.vy,d=Math.hypot(deltaX,deltaY),step=(length?s.spec.accel:s.spec.brake)*dt;
 if(d>step){s.vx+=deltaX/d*step;s.vy+=deltaY/d*step;}else{s.vx=targetX;s.vy=targetY;}
 s.x+=s.vx*dt;s.y+=s.vy*dt;
 const x=clamp(s.x,s.spec.r,s.width-s.spec.r),y=clamp(s.y,s.spec.size*.5,s.height-s.spec.size*.5);
 if(x!==s.x)s.vx=0;if(y!==s.y)s.vy=0;s.x=x;s.y=y;
}
function drones(s,dt){
 s.droneAngle=(s.droneAngle+dt*2)%(Math.PI*2);s.droneShot-=dt;
 if(s.loadout.drone!=='alpha'||s.droneShot>0)return;
 const x=s.x+Math.cos(s.droneAngle)*65,y=s.y+Math.sin(s.droneAngle)*40;
 let nearest=null,distance=Infinity;for(const e of s.enemies){if(e.hp<=0||e.y<0||e.retreat)continue;const d=Math.hypot(e.x-x,e.y-y);if(d<distance){distance=d;nearest=e;}}
 if(nearest){const angle=Math.atan2(nearest.y-y,nearest.x-x);bullet(s,x,y,Math.cos(angle)*480,Math.sin(angle)*480,'plasma',1.3,'drone');emit(s,'shot_drone',{x});s.droneShot=.65;}
}
function hitPlayer(s,amount){
 if(s.invincible>0||s.ending)return;
 const damage=amount*(s.loadout.drone==='beta'?.75:1)*s.difficulty.damage;emit(s,s.loadout.drone==='beta'?'shield_hit':'armor_hit');s.hp=Math.max(0,s.hp-damage);s.stats.damageTaken+=damage;s.invincible=.85;s.damageFlash=.25;s.shake=.16;effect(s,'impact',s.x,s.y,s.spec.size*.65);
}
function deaths(s){
 for(const e of s.enemies){
  if(e.hp>0||e.resolved)continue;e.resolved=true;
  const previousCharge=s.novaCharge;
  const credited=e.destroyedBy==='player'||e.destroyedBy==='drone';
  if(e.destroyedBy!=='collision'){s.kills++;s.score+=e.boss?1500:e.type==='heavy'?300:100;if(credited){s.novaCharge=Math.min(100,s.novaCharge+(NOVA.charge[e.type]||0));s.stats[e.destroyedBy==='player'?'playerKills':'droneKills']++;}else if(e.destroyedBy==='nova')s.stats.novaKills++;}
  if(s.novaCharge===100&&previousCharge<100)emit(s,'ready');emit(s,e.boss?'spectra_final':e.type==='heavy'?'explosion_large':e.type==='interceptor'?'explosion_medium':'explosion_small',{x:e.x});
  effect(s,e.type==='heavy'||e.boss?'largeExplosion':'explosion',e.x,e.y,e.boss?250:e.size*1.5);
  if(e.boss){s.ending={time:0,duration:2.4,x:e.x,y:e.y,next:0};s.hostile=[];s.bullets=[];s.vx=0;s.vy=0;s.shake=.3;}
 }
 s.enemies=s.enemies.filter(e=>!e.resolved);
}
function finale(s,dt){
 const end=s.ending;end.time+=dt;
 if(end.time>=end.next&&end.time<1.8){const i=Math.round(end.next/.18),a=i*2.4;effect(s,i%3===0?'largeExplosion':'explosion',end.x+Math.cos(a)*75,end.y+Math.sin(a)*60,i%3===0?170:90);end.next+=.18;}
 if(end.time>=end.duration){emit(s,'victory');s.over=true;s.victory=true;s.phase='SPECTRA / NEUTRALISÉE';}
}
export function update(s,dt,input={},scenario=null){
 if(s.over||!Number.isFinite(dt)||dt<=0||dt>.05)return;
 s.t+=dt;s.invincible=Math.max(0,s.invincible-dt);advanceEffects(s,dt);
 if(s.ending){finale(s,dt);return;}
 movePlayer(s,dt,input);firePlayer(s,dt);drones(s,dt);
 if(!scenario)s.phase=s.t<12?'01 / ESCADRILLES':s.t<24?'02 / FLANQUEMENT':s.t<38?'03 / SALVES LOURDES':'SPECTRA / APPROCHE';
 if(scenario)scenario.spawn?.(s,dt);else spawnWaves(s);
 scenario?.snapshot(s,dt);advanceBullets(s,dt);if(scenario)scenario.move(s,dt);else updateEnemies(s,dt);
 scenario?.resolve(s,dt);
 for(const e of s.enemies){
  if(e.hp<=0||scenario?.handles(e))continue;
  for(const b of s.bullets)if(!b.dead&&e.hp>0&&circleRect(e.x,e.y,e.r,b.x-4,b.y-11,8,22)){
   if(damageEnemy(s,e,b.damage,b.owner)){b.dead=true;effect(s,'impact',b.x,b.y,b.kind==='missile'?48:25);}
  }
  if(e.hp>0&&e.y>0&&Math.hypot(e.x-s.x,e.y-s.y)<e.r+s.spec.r){hitPlayer(s,e.boss?26:20);if(!e.boss&&e.type!=='heavy'){e.hp=0;e.destroyedBy='collision';}}
 }
 for(const b of s.hostile){b.arm-=dt;b.life-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.arm<=0&&Math.hypot(b.x-s.x,b.y-s.y)<s.spec.r+b.r){hitPlayer(s,b.damage);b.dead=true;}}
 deaths(s);
 s.enemies=s.enemies.filter(e=>{if(scenario?.handles(e))return true;const out=e.retreat?e.y< -200:e.type==='interceptor'?e.age>7:e.y>s.height+100||e.x< -200||e.x>s.width+200;if(out)s.stats.escaped++;return !out;});
 s.bullets=s.bullets.filter(b=>!b.dead);s.hostile=s.hostile.filter(b=>!b.dead&&b.life>0&&b.x> -100&&b.x<s.width+100&&b.y> -150&&b.y<s.height+80);
 // Un ennemi qui s’échappe n’inflige aucun dégât gratuit au pilote.
 if(s.hp<=0){emit(s,'explosion_large');s.over=true;s.victory=false;effect(s,'largeExplosion',s.x,s.y,s.spec.size*1.7);}
}

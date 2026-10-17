import {emit} from './events.js';
import {LIMITS,WEAPONS} from './content.js';
import {clamp} from './core.js';
export function bullet(s,x,y,vx,vy,kind,damage,owner='player'){
 if(s.bullets.length>=LIMITS.bullets)return;
 const spec=WEAPONS[kind==='spread'?'impact':kind==='missile'?'missile':'flux'];
 s.bullets.push({x,y,vx,vy,kind,damage,owner,life:spec.life,trail:[],trailTime:0,targetId:null});
 s.stats.shots++;
}
export function firePlayer(s,dt){
 s.shot-=dt;s.switchLock=Math.max(0,s.switchLock-dt);
 if(s.shot>0)return;
 emit(s,s.loadout.weapon==='impact'?'shot_spread':s.loadout.weapon==='missile'?'shot_missile':'shot_plasma');
 const weapon=WEAPONS[s.loadout.weapon],damage=s.spec.damage*weapon.multiplier,y=s.y-s.spec.size*.42;
 if(s.loadout.weapon==='impact')for(const vx of [-160,0,160])bullet(s,s.x,y,vx,-weapon.speed,'spread',damage);
 else bullet(s,s.x,y,0,-weapon.speed,s.loadout.weapon==='missile'?'missile':'plasma',damage);
 s.shot+=s.spec.cooldown*weapon.cooldown;
}
export function cycleWeapon(s){
 if(s.over||s.ending||s.switchLock>0)return false;
 const ids=Object.keys(WEAPONS);s.loadout.weapon=ids[(ids.indexOf(s.loadout.weapon)+1)%ids.length];
 // Changer d’arme ne supprime jamais le délai du tir précédent.
 s.shot=Math.max(.12,s.shot);s.switchLock=.25;return true;
}
export function advanceBullets(s,dt){
 for(const b of s.bullets){
  b.life-=dt;
  if(b.kind==='missile'){
   let target=s.enemies.find(e=>e.id===b.targetId&&e.hp>0&&e.y>0&&!e.retreat);
   if(!target){let best=Infinity;for(const e of s.enemies){if(e.hp<=0||e.y<0||e.y>b.y+60||e.retreat)continue;const d=(e.x-b.x)**2+(e.y-b.y)**2;if(d<best){best=d;target=e;}}b.targetId=target?.id??null;}
   if(target){const current=Math.atan2(b.vy,b.vx),desired=Math.atan2(target.y-b.y,target.x-b.x);const delta=Math.atan2(Math.sin(desired-current),Math.cos(desired-current));const angle=current+clamp(delta,-WEAPONS.missile.turn*dt,WEAPONS.missile.turn*dt);b.vx=Math.cos(angle)*WEAPONS.missile.speed;b.vy=Math.sin(angle)*WEAPONS.missile.speed;}
   b.trailTime-=dt;if(b.trailTime<=0){b.trail.push({x:b.x,y:b.y});if(b.trail.length>LIMITS.trail)b.trail.shift();b.trailTime=.035;}
  }
  b.x+=b.vx*dt;b.y+=b.vy*dt;
 }
 s.bullets=s.bullets.filter(b=>!b.dead&&b.life>0&&b.y>-180&&b.y<s.height+180&&b.x>-100&&b.x<s.width+100);
}

import {LIMITS} from './content.js';
export function effect(s,kind,x,y,size){
 const life=kind==='impact'?.2:kind==='largeExplosion'?.85:.55;
 if(s.effects.length<LIMITS.effects)s.effects.push({kind,x,y,size,life,max:life});
 const count=kind==='impact'?2:kind==='largeExplosion'?20:9;
 for(let i=0;i<count&&s.particles.length<LIMITS.particles;i++){
  const angle=i*2.399+s.t,velocity=35+i*8;
  s.particles.push({kind:i%4===0&&kind!=='impact'?'debris':'impact',size:i%4===0?13:7,x,y,vx:Math.cos(angle)*velocity,vy:Math.sin(angle)*velocity,life:.3+i*.025,max:.9,angle});
 }
}
export function advanceEffects(s,dt){
 s.pulse=Math.max(0,s.pulse-dt);s.damageFlash=Math.max(0,s.damageFlash-dt);s.shake=Math.max(0,s.shake-dt);
 for(const e of s.effects)e.life-=dt;s.effects=s.effects.filter(e=>e.life>0);
 for(const e of s.particles){e.x+=e.vx*dt;e.y+=e.vy*dt;e.vx*=Math.exp(-dt*1.5);e.vy*=Math.exp(-dt*1.5);e.angle+=dt;e.life-=dt;}
 s.particles=s.particles.filter(e=>e.life>0);
}

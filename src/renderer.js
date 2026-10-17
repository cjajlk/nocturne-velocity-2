import {cueFor} from './difficulty.js';
import {viewport} from './core.js';
import {NOVA} from './content.js';
import {warningAngles} from './enemies.js';
export function createRenderer(canvas,images){const ctx=canvas.getContext('2d',{alpha:false});let backing=null,lastQuality=1;const timings=[];let quality=1;const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 function sprite(key,x,y,size,angle=0,alpha=1){const img=images[key];if(!img)return;const ratio=img.width/img.height;const w=ratio>1?size:size*ratio,h=ratio>1?size/ratio:size;ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);if(angle)ctx.rotate(angle);ctx.drawImage(img,-w/2,-h/2,w,h);ctx.restore();}
 function background(s){const width=s.width,height=s.height;if(!backing||backing.width!==canvas.width||backing.height!==canvas.height){backing=document.createElement('canvas');backing.width=canvas.width;backing.height=canvas.height;const c=backing.getContext('2d'),img=images.nebula;c.fillStyle='#030a15';c.fillRect(0,0,backing.width,backing.height);if(img){const k=Math.max(backing.width/img.width,backing.height/img.height);c.drawImage(img,(backing.width-img.width*k)/2,(backing.height-img.height*k)/2,img.width*k,img.height*k);}}
 // Tuiles alternées en miroir : leurs bords partagent les mêmes pixels.
 const travel=s.t*3,offset=travel%height,flip=Math.floor(travel/height)%2===1;ctx.globalAlpha=.85;function tile(y,mirror){ctx.save();ctx.translate(0,y+(mirror?height:0));if(mirror)ctx.scale(1,-1);ctx.drawImage(backing,0,0,width,height);ctx.restore();}tile(offset,flip);tile(offset-height,!flip);ctx.globalAlpha=1;
 for(let layer=0;layer<3;layer++){const count=Math.floor((layer===0?55:layer===1?35:20)*quality);ctx.fillStyle=['#557582','#9cbfc5','#e5e5c3'][layer];for(let i=0;i<count;i++){const x=((i*137.51+layer*83)%width),y=((i*193.37+layer*71)+s.t*(12+layer*23))%height;ctx.globalAlpha=.3+layer*.22;ctx.beginPath();ctx.arc(x,y,layer===2?1.25:.65,0,Math.PI*2);ctx.fill();}}ctx.globalAlpha=1;
 for(let i=0;i<(quality<.8?4:7);i++){const size=28+(i%3)*22,x=(i*219+75)%width,y=((i*173+s.t*(18+i*3))%(height+180))-90;sprite('asteroid',x,y,size,s.t*.025+i,.35);}
 for(let i=0;i<10;i++)sprite('debris',(i*191+37)%width,((i*113+s.t*49)%(height+100))-50,7+i%4*3,i+s.t*.07,.45);
 }
 function telegraph(s,e){
 const w=e.warning,cue=cueFor(s,e);if(!w||!cue.visible)return;if(!cue.lines){const positions=w.pattern==='columns'?w.columns:[e.x];for(const x of positions)sprite('impact',x,e.y+e.r*.7,e.boss?33:23,0,.8);return;}const progress=1-w.time/w.duration;
 ctx.save();ctx.strokeStyle=e.boss?'#ffb47b':'#efcb88';ctx.lineWidth=e.boss?1.7:1.2;ctx.globalAlpha=.35+progress*.45;ctx.setLineDash([8,8]);
 if(w.pattern==='columns')for(const x of w.columns){ctx.beginPath();ctx.moveTo(x,e.y+e.r);ctx.lineTo(x,s.height);ctx.stroke();}
 else{const distance=e.type==='fighter'||e.type==='interceptor'?125:Math.max(s.width,s.height);for(const angle of warningAngles(w)){ctx.beginPath();ctx.moveTo(e.x,e.y+e.r*.7);ctx.lineTo(e.x+Math.cos(angle)*distance,e.y+e.r*.7+Math.sin(angle)*distance);ctx.stroke();}}
 ctx.setLineDash([]);ctx.beginPath();ctx.arc(e.x,e.y,e.r+8+progress*6,0,Math.PI*2*progress);ctx.stroke();ctx.restore();
 }
 function render(s){const begin=performance.now(),rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,1.5),v=viewport(rect.width,rect.height);ctx.setTransform(dpr*v.scale,0,0,dpr*v.scale,0,0);ctx.fillStyle='#030a15';ctx.fillRect(0,0,s.width,s.height);background(s);ctx.save();if(!reducedMotion&&s.shake>0)ctx.translate(Math.sin(s.t*81)*2.2,Math.cos(s.t*97)*1.8);
 for(const e of s.enemies)telegraph(s,e);
 for(const e of s.enemies){
  if(e.y< -e.size)continue;sprite('engine',e.x,e.y-e.size*.32,e.size*.38,Math.PI,.7);sprite(e.type,e.x,e.y,e.size,e.bank||0);
  if(e.hitFlash>0){ctx.save();ctx.globalCompositeOperation='lighter';sprite(e.type,e.x,e.y,e.size,e.bank||0,.45);ctx.restore();}
  if(e.phaseFlash>0)sprite('shield',e.x,e.y,e.size*1.15,0,.4*e.phaseFlash);
  if(e.boss&&e.y>0){ctx.fillStyle='#260f23';ctx.fillRect(e.x-95,e.y+100,190,5);ctx.fillStyle='#ff6587';ctx.fillRect(e.x-95,e.y+100,190*Math.max(0,e.hp/(e.maxHp||360)),5);}
  else if(e.type==='heavy'&&e.y>0){ctx.globalAlpha=.7;ctx.fillStyle='#6e2837';ctx.fillRect(e.x-32,e.y+e.size*.52,64,3);ctx.fillStyle='#f3917e';ctx.fillRect(e.x-32,e.y+e.size*.52,64*Math.max(0,e.hp/e.maxHp),3);ctx.globalAlpha=1;}
 }
 for(const b of s.bullets){if(b.kind==='missile'&&b.trail.length){ctx.save();ctx.strokeStyle='#91cdd1';ctx.lineWidth=3;ctx.globalAlpha=.4;ctx.beginPath();b.trail.forEach((t,i)=>i?ctx.lineTo(t.x,t.y):ctx.moveTo(t.x,t.y));ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore();}sprite(b.kind,b.x,b.y,b.kind==='missile'?34:b.owner==='drone'?21:30,Math.atan2(b.vx,-b.vy));}
 for(const b of s.hostile)sprite('hostile',b.x,b.y,b.pattern==='columns'?34:23,Math.atan2(-b.vx,b.vy));
 const flame=s.spec.size*(.5+Math.sin(s.t*35)*.05);sprite('engine',s.x,s.y+s.spec.size*.48,flame);
 sprite(s.spec.asset,s.x,s.y,s.spec.size,Math.max(-.12,Math.min(.12,(s.vx||0)/2200)),s.invincible>0?.72:1);
 if(s.loadout.drone!=='none'){const x=s.x+Math.cos(s.droneAngle)*65,y=s.y+Math.sin(s.droneAngle)*40;sprite('drone',x,y,26);}
 if(s.loadout.drone==='beta'||s.invincible>0)sprite('shield',s.x,s.y,s.spec.size*1.45,0,s.invincible>0?.9:.4);
 for(const e of s.effects){const f=1-e.life/e.max;sprite(e.kind,e.x,e.y,e.size*(.6+f*.7),f*.2,Math.min(1,e.life*5));}
 ctx.save();ctx.globalCompositeOperation='lighter';for(let i=0;i<s.particles.length;i++){if(quality<.8&&i%2)continue;const e=s.particles[i];sprite(e.kind||'impact',e.x,e.y,e.size||8,e.angle||0,Math.min(1,e.life*2));}if(s.pulse>0&&s.novaOrigin)sprite('nova',s.novaOrigin.x,s.novaOrigin.y,(1-s.pulse/.65)*NOVA.radius*2,0,Math.min(1,s.pulse*4));ctx.restore();
 if(s.ending){const end=s.ending,fade=Math.max(0,1-end.time/1.8);if(fade>0)sprite('spectra',end.x,end.y,240+end.time*12,end.time*.05,fade);if(end.time>1)sprite('nova',end.x,end.y,(end.time-1)*500,0,Math.max(0,1-(end.time-1)/1.4));}
 ctx.restore();if(s.damageFlash>0){ctx.save();ctx.strokeStyle='#ffb28c';ctx.globalAlpha=s.damageFlash*2;ctx.lineWidth=4;ctx.strokeRect(2,2,s.width-4,s.height-4);ctx.restore();}
 const ms=performance.now()-begin;timings.push(ms);if(timings.length>120)timings.shift();if(timings.length===120){const mean=timings.reduce((a,b)=>a+b,0)/120;quality=mean>12?.65:1;}lastQuality=quality;return ms;
 }
 return {render,metrics(){const a=[...timings].sort((a,b)=>a-b);return {renderMeanMs:a.reduce((x,y)=>x+y,0)/Math.max(1,a.length),renderP95Ms:a[Math.floor(a.length*.95)]||0,quality:lastQuality,samples:a.length};}};
}

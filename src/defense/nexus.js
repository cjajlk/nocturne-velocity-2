import {BOMBERS} from './config.js';
export function createNexusDefense(){
 let integrity=100,time=0,paused=false,closed=false,critical=false;const actors=new Map(),events=[];
 const active=()=>!paused&&!closed&&integrity>0;
 const emit=(type,id)=>{if(events.length>=32)events.shift();events.push({type,id,at:time,integrity});};
 return {
  get state(){return {integrity,time,paused,closed,destroyed:integrity===0,critical:integrity>0&&integrity<=30,activeBombers:[...actors.values()].filter(a=>!a.resolved).length};},
  register(id,kind){if(!active()||!Number.isInteger(id)||id<=0||!Object.hasOwn(BOMBERS,kind)||actors.has(id))return false;actors.set(id,{id,kind,resolved:false,near:false});emit('detected',id);return true;},
  tick(dt){if(active()&&Number.isFinite(dt)&&dt>0)time+=dt;},
  approach(id){const a=actors.get(id);if(!active()||!a||a.resolved||a.near)return false;a.near=true;emit('approach',id);return true;},
  destroyed(id){const a=actors.get(id);if(!active()||!a||a.resolved)return false;a.resolved=true;return true;},
  crossing(id){const a=actors.get(id);if(!active()||!a||a.resolved)return false;a.resolved=true;integrity=Math.max(0,integrity-BOMBERS[a.kind].damage);emit('hit',id);if(!critical&&integrity<=30){critical=true;emit('critical',id);}if(integrity===0){emit('destroyed',id);for(const a of actors.values())a.resolved=true;}return true;},
  suspend(){paused=true;},resume(){if(!closed&&integrity>0)paused=false;},
  end(){closed=true;actors.clear();events.length=0;},
  takeEvents(){return events.splice(0);}
 };
}

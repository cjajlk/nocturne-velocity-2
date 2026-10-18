import {createSession} from './session.js';
import {createNexusMissionSession} from './campaign/nexus-m01.js';
import {confirmedMissionResult} from './campaign/results.js';
// Un seul vol actif ; les deux contrôleurs conservent leurs propres règles.
export function createFlightSession(){
 const ambre=createSession(),nexus=createNexusMissionSession();let current=ambre,missionId=null,delivered=false;
 return {
  get run(){return current.run;},get paused(){return current.paused;},get launching(){return current.launching;},get revision(){return current.revision;},get missionId(){return missionId;},
  start(loadout,prepare,id=null){
   if(id!==null&&id!=='nexus_m01')throw new RangeError('Mission indisponible');
   if(current.launching||(current.run&&!current.run.over))return Promise.resolve(null);
   current.abandon();missionId=id;delivered=false;current=id?nexus:ambre;return current.start(loadout,prepare);
  },
  cancelStart:()=>current.cancelStart(),active:(...args)=>current.active(...args),step:(...args)=>current.step(...args),pause:()=>current.pause(),resume:()=>current.resume(),
  abandon(){current.abandon();missionId=null;delivered=false;current=ambre;},
  takeResult(){if(!missionId)return current.takeResult();if(delivered)return null;const result=confirmedMissionResult(current.run);if(result)delivered=true;return result;}
 };
}

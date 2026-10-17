import {createRun,update} from './combat.js';

// Cycle de vie du vol ; aucune écriture de stockage ni dépendance au DOM/audio.
export function createSession(){
 let run=null,paused=false,pending=false,generation=0,revision=0,recorded=false;
 const active=(combatVisible,foreground)=>!!run&&combatVisible&&foreground&&!paused&&!run.over;
 return {
  get run(){return run;},get paused(){return paused;},get launching(){return pending;},get revision(){return revision;},
  async start(loadout,prepare=async()=>{}){
   if(pending||(run&&!run.over))return null;
   const ticket=++generation,snapshot={...loadout};pending=true;revision++;
   const current=()=>generation===ticket&&pending;
   try{
    await prepare(current);
    if(!current())return null;
    run=createRun(snapshot);paused=false;recorded=false;revision++;
    return run;
   }catch(error){if(generation===ticket)throw error;return null;}
   finally{if(generation===ticket)pending=false;}
  },
  cancelStart(){generation++;pending=false;revision++;},
  abandon(){generation++;pending=false;run=null;paused=false;recorded=false;revision++;},
  pause(){if(!run||run.over||paused)return false;paused=true;revision++;return true;},
  resume(){if(!run||run.over||!paused)return false;paused=false;revision++;return true;},
  active,
  step(dt,input,combatVisible,foreground){if(active(combatVisible,foreground))update(run,dt,input);},
  takeResult(){
   if(!run?.over||recorded)return null;
   recorded=true;return {score:run.score,victory:run.victory};
  }
 };
}

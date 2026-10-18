import {SHIPS,WEAPONS,DRONES} from './content.js';
import {load,save} from './storage.js';

// Profil commun au menu et aux nouveaux vols, avec le schéma V1 inchangé.
export function createGarage(storage,onSaveError=()=>{},{readBalance=null}={}){
 const profile=load(storage),catalogs={ship:SHIPS,weapon:WEAPONS,drone:DRONES};
 function persist(){if(!save(storage,profile))onSaveError();}
 return {
  get profile(){return {...profile,...(readBalance?{credits:readBalance()}: {})};},
  select(kind,value){if(!Object.hasOwn(catalogs,kind)||!Object.hasOwn(catalogs[kind],value))return false;profile[kind]=value;persist();return true;},
  recordResult(result){profile.best=Math.max(profile.best,result.score);persist();}
 };
}

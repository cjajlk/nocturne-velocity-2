import {missionById} from './catalog.js';
import {WEAPONS} from '../content.js';
export const CAMPAIGN_WEAPON_RULES=Object.freeze([
 Object.freeze({id:'flux',missionId:null,label:'Disponible dès la Mission 01'}),
 Object.freeze({id:'impact',missionId:'nexus_m02',label:'Victoire à la Mission 02'}),
 Object.freeze({id:'missile',missionId:'nexus_m04',label:'Victoire à la Mission 04'})
]);
// Le cache de sauvegarde n'est jamais une autorisation. Les missions non développées
// restent ignorées. Le résolveur injectable sert aux tests synthétiques des futurs lots.
export function campaignWeaponIds(progress,{missionImplemented=id=>missionById(id)?.playable===true}={}){
 return CAMPAIGN_WEAPON_RULES.filter(rule=>!rule.missionId||(progress?.version===1&&progress.campaign?.version===1&&missionImplemented(rule.missionId)&&progress.campaign.missions?.[rule.missionId]?.completed===true)).map(rule=>rule.id);
}
export function weaponProgressCompatibility(value){
 if(value===undefined)return 'valid';
 if(!value||typeof value!=='object'||Array.isArray(value))return 'corrupt';
 if(value.version!==1)return 'incompatible';
 if(!Array.isArray(value.unlocked)||value.unlocked.some(id=>typeof id!=='string'))return 'corrupt';
 if(value.unlocked.some(id=>!Object.hasOwn(WEAPONS,id)))return 'incompatible';
 return value.unlocked.includes('flux')?'valid':'corrupt';
}
export function withCampaignWeaponCache(progress){
 const next=structuredClone(progress);next.campaign??={version:1,missions:{}};
 next.campaign.weapons={...next.campaign.weapons,version:1,unlocked:campaignWeaponIds(next)};return next;
}
const policies=new WeakMap();
export function protectCampaignArmament(run,progress){
 const allowed=Object.freeze(campaignWeaponIds(progress));let weapon=allowed.includes(run.loadout.weapon)?run.loadout.weapon:'flux';
 const loadout=run.loadout;
 Object.defineProperty(loadout,'weapon',{enumerable:true,configurable:false,get:()=>weapon,set(value){if(allowed.includes(value))weapon=value;}});
 Object.defineProperty(run,'loadout',{value:loadout,enumerable:true,configurable:false,writable:false});policies.set(run,allowed);return run;
}
export const campaignRunWeaponIds=run=>[...(policies.get(run)??['flux'])];
export function cycleCampaignWeapon(run){
 const ids=policies.get(run);if(!ids||ids.length<2||run.over||run.ending||run.switchLock>0)return false;
 run.loadout.weapon=ids[(ids.indexOf(run.loadout.weapon)+1)%ids.length];
 // Même verrou de commutation que weapons.js ; les tirs et caractéristiques sont inchangés.
 run.shot=Math.max(.12,run.shot);run.switchLock=.25;return true;
}

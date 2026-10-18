import {missionById,missionsForSystem,CAMPAIGN_SYSTEMS} from './catalog.js';
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const own=(v,k)=>Object.hasOwn(v,k);
export function initialMissionRecord(id){const mission=missionById(id);if(!mission)throw new TypeError('Mission inconnue');return {completed:false,bestStars:Object.fromEntries(mission.difficulties.map(d=>[d,0]))};}
// Les extensions inconnues restent opaques ; seuls nos champs connus sont validés.
export function campaignCompatibility(campaign){
 if(campaign===undefined)return 'valid';
 if(!object(campaign))return 'corrupt';
 if(campaign.version!==1)return 'incompatible';
 if(!object(campaign.missions))return 'corrupt';
 for(const [id,record] of Object.entries(campaign.missions)){
  const mission=missionById(id);if(!mission)continue;
  if(!object(record)||typeof record.completed!=='boolean'||!object(record.bestStars))return 'corrupt';
  if(mission.difficulties.some(d=>!own(record.bestStars,d)||!Number.isInteger(record.bestStars[d])||record.bestStars[d]<0||record.bestStars[d]>3))return 'corrupt';
  if(record.completed!==mission.difficulties.some(d=>record.bestStars[d]>0))return 'corrupt';
 }
 return 'valid';
}
export function missionRecord(progress,id){return structuredClone(progress?.campaign?.missions?.[id]??initialMissionRecord(id));}
export function systemCampaignProgress(progress,id){
 const missions=missionsForSystem(id),completed=missions.filter(m=>missionRecord(progress,m.id).completed).length;
 return {completed,total:CAMPAIGN_SYSTEMS[id]?.missionCount??missions.length};
}
// Fondation pour un futur producteur de résultat de combat validé. Aucun appel UI au lot 1.
// Ce contrat de données ne prouve pas à lui seul l'authenticité d'une victoire.
export function applyCampaignVictory(progress,result){
 const mission=missionById(result?.missionId);
 if(progress?.version!==1||campaignCompatibility(progress.campaign)!=='valid'||!mission||result.victory!==true||!mission.difficulties.includes(result.difficulty)||!Number.isInteger(result.stars)||result.stars<1||result.stars>3)throw new TypeError('Résultat de campagne invalide');
 const current=missionRecord(progress,mission.id),best=Math.max(current.bestStars[result.difficulty],result.stars);
 if(current.completed&&best===current.bestStars[result.difficulty])return {state:structuredClone(progress),changed:false};
 const next=structuredClone(progress);next.campaign??={version:1,missions:{}};
 next.campaign.missions[mission.id]={...current,completed:true,bestStars:{...current.bestStars,[result.difficulty]:best}};
 return {state:next,changed:true};
}

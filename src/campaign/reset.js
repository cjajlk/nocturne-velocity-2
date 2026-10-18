import {campaignCompatibility} from './progression.js';
// Réinitialise uniquement les champs de campagne reconnus. Les extensions opaques,
// accès galactiques et accomplissements restent intacts.
export function resetCampaignProgress(progress){
 if(progress?.version!==1||campaignCompatibility(progress.campaign)!=='valid')throw new TypeError('Campagne incompatible');
 const next=structuredClone(progress);next.campaign??={version:1,missions:{}};
 for(const record of Object.values(next.campaign.missions)){
  if(!record||typeof record!=='object'||Array.isArray(record)||typeof record.completed!=='boolean'||!record.bestStars||typeof record.bestStars!=='object'||Array.isArray(record.bestStars))continue;
  record.completed=false;for(const difficulty of ['easy','normal','hard'])if(Object.hasOwn(record.bestStars,difficulty))record.bestStars[difficulty]=0;
 }
 next.campaign.weapons={...next.campaign.weapons,version:1,unlocked:['flux']};return next;
}

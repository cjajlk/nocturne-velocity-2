import {DIFFICULTIES} from '../difficulty.js';
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export const CAMPAIGN_SYSTEMS=freeze({nexus:{missionCount:5}});
export const MISSIONS=freeze([{
 id:'nexus_m01',systemId:'nexus',name:'Première Alerte',type:'defense',order:1,
 difficulties:Object.keys(DIFFICULTIES),status:'available',playable:true,
 description:'Défendre Nexus contre une attaque ennemie.',
 introduction:'ALERTE NEXUS — Plusieurs signatures hostiles détectées. Les défenses orbitales sont compromises. Interceptez les assaillants et protégez la station.',
 objective:'Protéger la station Nexus et survivre à l’attaque.'
}]);
export const missionById=id=>MISSIONS.find(m=>m.id===id)||null;
export const missionsForSystem=id=>MISSIONS.filter(m=>m.systemId===id);

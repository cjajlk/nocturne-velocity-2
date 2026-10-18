import {nexusMissionState} from './nexus-m01.js';
import {missionRecord,systemCampaignProgress} from './progression.js';
export function starsForIntegrity(integrity){return !Number.isFinite(integrity)||integrity<=0||integrity>100?0:integrity<60?1:integrity<90?2:3;}
// Le contrôleur privé reste l'autorité, jamais le drapeau victory du moteur partagé.
export function confirmedMissionResult(run){
 const m=nexusMissionState(run),end=m?.outcome;if(!run?.over||!end||end.reason==='abandoned')return null;
 if(end.reason!=='objectives_met')return Object.freeze({kind:'campaign',missionId:m.id,difficulty:m.plannedDifficulty,victory:false,cause:end.reason,integrity:end.nexus,stars:0});
 if(m.phase!==3||!m.breakerDestroyed||m.pending||m.active||run.enemies.length||run.hostile.length||run.nexus.state.activeBombers||run.hp<=0||end.armor<=0||run.nexus.state.integrity<=0||!starsForIntegrity(end.nexus)||m.history.length!==3||m.history.some((h,i)=>h.phase!==i+1||h.remainingEnemies||h.remainingHostile))return null;
 return Object.freeze({kind:'campaign',missionId:m.id,difficulty:m.plannedDifficulty,victory:true,cause:null,integrity:end.nexus,stars:starsForIntegrity(end.nexus)});
}
export function createMissionResults(store){
 const settled=new WeakMap();
 function describe(result,persistence){const record=missionRecord(store.state,result.missionId);return {...result,persisted:persistence.persisted,saveIssue:persistence.reason,bestStars:record.bestStars[result.difficulty],progress:systemCampaignProgress(store.state,'nexus')};}
 return {
  settle(run){
   if(settled.has(run))return structuredClone(settled.get(run));
   const result=confirmedMissionResult(run);if(!result)return null;
   const persistence=result.victory?store.recordMissionVictory(result):{persisted:false,reason:null};
   const view=describe(result,persistence);settled.set(run,view);return structuredClone(view);
  },
  retry(run){const view=settled.get(run);if(!view?.victory)return null;if(!view.persisted){const persisted=store.flush();const next=describe(view,{persisted,reason:store.diagnostics.issue});settled.set(run,next);}return structuredClone(settled.get(run));}
 };
}

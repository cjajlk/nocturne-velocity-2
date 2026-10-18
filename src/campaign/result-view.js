import {DIFFICULTIES} from '../difficulty.js';
export function createMissionResultView(root,{replay,back,retry}){
 const get=id=>root.querySelector('#'+id);
 get('missionReplay').onclick=replay;get('missionMap').onclick=back;get('retryMissionSave').onclick=retry;
 return {
  hide(){root.hidden=true;},
  show(result,{focus=true}={}){
   root.hidden=false;get('resultDifficulty').textContent=DIFFICULTIES[result.difficulty].name;get('missionResultTitle').textContent=result.victory?'Mission accomplie':'Mission échouée';
   get('missionResultCause').textContent=result.victory?'Première Alerte · Nexus sécurisée':result.cause==='defeat_nexus'?'Nexus a été détruite.':'Votre vaisseau a été détruit.';
   get('missionVictoryDetails').hidden=!result.victory;
   if(result.victory){get('finalNexus').textContent=`${result.integrity} %`;get('earnedStars').textContent=`${'★'.repeat(result.stars)}${'☆'.repeat(3-result.stars)} · ${result.stars}/3 étoiles`;get('bestMissionStars').textContent=`${result.bestStars}/3 étoiles`;get('nexusProgress').textContent=`Nexus ${result.progress.completed}/${result.progress.total}`;}
   get('missionSaveStatus').textContent=!result.victory?'Aucun record modifié.':result.persisted?'Résultat enregistré durablement sur cet appareil.':'Résultat non enregistré durablement — conservé en mémoire pour cette session. Réessayez avant de quitter.';
   get('missionSaveStatus').classList.toggle('save-pending',result.victory&&!result.persisted);get('retryMissionSave').hidden=!result.victory||result.persisted;
   get('missionReplay').textContent=result.victory?'Rejouer':'Réessayer';if(focus)get('missionResultTitle').focus({preventScroll:true});
  }
 };
}

import {renderCampaignWeapons} from './weapon-view.js';
import {systemCampaignProgress} from './progression.js';
export const RESET_CONFIRMATION='Cette action effacera les missions terminées, les étoiles et les armes débloquées de la campagne. Elle ne modifiera pas Faille d’Ambre, les préférences ni le garage. Continuer ?';
export function createCampaignOptions(root,{store,canReset,onChanged=()=>{},onClose=()=>{}}){
 const get=id=>root.querySelector('#'+id);let previousFocus=null;
 get('resetConfirmationText').textContent=RESET_CONFIRMATION;
 function refresh(){renderCampaignWeapons(get('optionsCampaignWeapons'),store.state);const p=systemCampaignProgress(store.state,'nexus');get('optionsCampaignProgress').textContent=`Nexus ${p.completed}/${p.total}`;get('resetCampaignOpen').disabled=!canReset();}
 function cancel(){get('resetConfirmation').hidden=true;get('resetCampaignOpen').hidden=false;get('resetFeedback').textContent='';get('resetCampaignOpen').focus();}
 function close(){if(root.open)root.close();}
 root.addEventListener('close',()=>{get('resetConfirmation').hidden=true;onClose();if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});});
 root.addEventListener('cancel',event=>{if(!get('resetConfirmation').hidden){event.preventDefault();cancel();}});
 get('optionsClose').onclick=close;get('resetCampaignCancel').onclick=cancel;
 get('resetCampaignOpen').onclick=()=>{if(!canReset()){get('resetFeedback').textContent='Quittez le vol avant de réinitialiser la campagne.';return;}get('resetFeedback').textContent='';get('resetCampaignOpen').hidden=true;get('resetConfirmation').hidden=false;get('resetCampaignCancel').focus();};
 get('resetCampaignConfirm').onclick=()=>{
  if(get('resetConfirmation').hidden)return;
  const result=store.resetCampaign({confirmed:true});
  if(result.persisted){refresh();get('resetConfirmation').hidden=true;get('resetCampaignOpen').hidden=false;get('resetFeedback').textContent='Campagne réinitialisée et enregistrée durablement. Plasma reste disponible.';onChanged();get('resetFeedback').focus({preventScroll:true});}
  else{get('resetFeedback').textContent=result.reason==='session-active'?'Quittez le vol avant de réinitialiser la campagne.':'Réinitialisation non confirmée durablement. Les données affichées restent inchangées. Stockage indisponible, incompatible ou modifié ailleurs.';get('resetFeedback').focus({preventScroll:true});}
 };
 return {
  get open(){return root.open;},
  show(){if(root.open)return;previousFocus=document.activeElement;get('resetConfirmation').hidden=true;get('resetCampaignOpen').hidden=false;get('resetFeedback').textContent='';refresh();root.showModal();get('optionsClose').focus();},close,refresh
 };
}

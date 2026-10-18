import {campaignWeaponIds} from './weapons.js';
import {WEAPONS} from '../content.js';
import {missionById,missionsForSystem} from './catalog.js';
import {missionRecord,systemCampaignProgress} from './progression.js';
import {DIFFICULTIES} from '../difficulty.js';
export function createCampaignView(host,readProgress,{onLaunch,canLaunch=()=>false,defaultDifficulty=()=>'normal'}={}){
 let systemId=null,systemName='',selected=null,choice=defaultDifficulty();
 function render(system){
  if(system&&system.id!==systemId){systemId=system.id;systemName=system.name;selected=null;}
  const missions=missionsForSystem(systemId);host.hidden=!missions.length;host.replaceChildren();if(!missions.length)return;
  const progress=readProgress(),summary=systemCampaignProgress(progress,systemId),heading=document.createElement('p');heading.className='campaign-summary';heading.textContent=`Campagne ${systemName} · ${summary.completed}/${summary.total} missions terminées`;host.append(heading);
  if(!selected){
   for(const mission of missions){const button=document.createElement('button');button.type='button';button.className='campaign-mission-card';button.dataset.missionOpen=mission.id;button.textContent=`${mission.name} · ${mission.playable?'Jouer':'En préparation'}`;button.setAttribute('aria-label',`Consulter ${mission.name}, mission ${mission.order} sur ${summary.total}, ${mission.playable?'disponible':'en préparation'}`);host.append(button);}const next=document.createElement('p');next.className='campaign-next';next.textContent='Mission 02/25 · À venir';host.append(next);return;
  }
  const mission=missionById(selected),record=missionRecord(progress,mission.id),article=document.createElement('article');article.className='campaign-mission-sheet';article.setAttribute('aria-labelledby','campaignMissionTitle');
  const title=document.createElement('h3');title.id='campaignMissionTitle';title.tabIndex=-1;title.textContent=mission.name;article.append(title);
  for(const text of [`Mission ${mission.order}/${summary.total} · Défense`,mission.objective,record.completed?'Mission terminée':'Mission non terminée']){const p=document.createElement('p');p.textContent=text;article.append(p);}
  const table=document.createElement('table');table.className='campaign-records';const caption=document.createElement('caption');caption.textContent='Meilleurs records par difficulté';table.append(caption);const body=document.createElement('tbody');
  for(const difficulty of mission.difficulties){const row=document.createElement('tr'),label=document.createElement('th'),stars=document.createElement('td');label.scope='row';label.textContent=DIFFICULTIES[difficulty].name;stars.dataset.recordDifficulty=difficulty;stars.textContent=`${record.bestStars[difficulty]}/3 étoiles`;row.append(label,stars);body.append(row);}table.append(body);article.append(table);
  if(mission.playable&&onLaunch){
   const armament=document.createElement('p');armament.className='campaign-weapon-brief';const allowed=campaignWeaponIds(progress);armament.textContent=(allowed.length===1?'Arme autorisée : ':'Armes autorisées : ')+allowed.map(id=>WEAPONS[id].name).join(', ');article.insertBefore(armament,table);
   const label=document.createElement('label');label.textContent='Difficulté';label.className='campaign-difficulty';const select=document.createElement('select');select.id='missionDifficulty';
   for(const d of mission.difficulties)select.add(new Option(DIFFICULTIES[d].name,d));select.value=choice;select.onchange=()=>{choice=select.value;};label.append(select);
   const play=document.createElement('button');play.type='button';play.dataset.launch=mission.id;play.className='primary campaign-play';play.textContent='JOUER';play.disabled=!canLaunch();article.insertBefore(label,table);article.insertBefore(play,table);
  }else{const unavailable=document.createElement('p');unavailable.className='campaign-unavailable';unavailable.textContent='En préparation';article.append(unavailable);}
  const briefing=document.createElement('details'),briefingSummary=document.createElement('summary'),intro=document.createElement('p');briefingSummary.textContent='Briefing de mission';intro.textContent=mission.introduction;briefing.append(briefingSummary,intro);article.append(briefing);const next=document.createElement('p');next.className='campaign-next';next.textContent='Mission 02/25 · À venir';article.append(next);
  const back=document.createElement('button');back.type='button';back.dataset.missionBack='';back.textContent='Retour aux missions';article.append(back);host.append(article);
 }
 function handleClick(event){
  const play=event.target.closest('[data-launch]');if(play&&host.contains(play)){const mission=missionById(play.dataset.launch);if(!mission?.playable||mission.id!==selected||!canLaunch()||!onLaunch)return;play.disabled=true;onLaunch(mission.id,choice);return;}
  const open=event.target.closest('[data-mission-open]');if(open&&host.contains(open)){const mission=missionById(open.dataset.missionOpen);if(!mission||mission.systemId!==systemId)return;selected=mission.id;render();const title=host.querySelector('h3'),content=host.closest('.destination-content');title?.focus({preventScroll:true});if(title&&content)content.scrollTop+=title.getBoundingClientRect().top-content.getBoundingClientRect().top;}
  const back=event.target.closest('[data-mission-back]');if(back&&host.contains(back)){selected=null;render();host.querySelector('[data-mission-open]')?.focus({preventScroll:true});}
 }
 return {render,handleClick};
}

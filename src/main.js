import {initializePersistence} from './persistence/runtime.js';
import {campaignRunWeaponIds,cycleCampaignWeapon} from './campaign/weapons.js';
import {renderCampaignWeapons} from './campaign/weapon-view.js';
import {createCampaignOptions} from './campaign/options-view.js';
import {createFlightSession} from './flight-session.js';
import {createMissionResults} from './campaign/results.js';
import {createMissionResultView} from './campaign/result-view.js';
import {nexusMissionState} from './campaign/nexus-m01.js';
import {createDefenseHUD} from './defense/view.js';
import {setDefenseBounds} from './defense/simulation.js';
import {createPortraitGuard} from './portrait.js';
import {createAudioManager} from './audio.js';
import {loadPreferences,savePreferences} from './preferences.js';
import {takeEvents} from './events.js';
import {SHIPS,WEAPONS,DRONES,ASSETS} from './content.js';
import {createGalaxyView} from './galaxy/view.js';
import {createProgressStore} from './progression/storage.js';
import {createGarage} from './garage.js';import {createNavigation} from './navigation.js';import {viewport,pointer,createClock} from './core.js';import {setBounds,nova} from './combat.js';import {cycleWeapon} from './weapons.js';import {loadAssets} from './assets.js';import {createCJAdapter} from './adapters/cj.js';import {createRenderer} from './renderer.js';
async function boot(){
const $=id=>document.getElementById(id),canvas=$('canvas'),clock=createClock(),cj=createCJAdapter();
$('start').disabled=true;$('mapLaunch').disabled=true;
let historical;try{historical=window.localStorage;}catch{historical=null;}
let stopForStorage=()=>{};
const persistence=await initializePersistence({indexedDB:window.indexedDB,storage:historical,onIssue:()=>{stopForStorage();$('status').textContent='Sauvegarde bloquée : fermez les anciens onglets et rechargez. Les données ne sont pas réinitialisées.';document.querySelector('main').inert=true;}});
const storage=persistence.storage;
Object.defineProperty(window,'nv2PersistenceDiagnostics',{value:()=>persistence.diagnostics});
const progression=createProgressStore(storage,{canResetCampaign:()=>!session.launching&&!session.run,onIssue:()=>{$('status').textContent=persistence.blocked?'Sauvegarde bloquée : rechargez avant de continuer. Données conservées.':'Progression indisponible : données conservées, session en mémoire.';}});progression.initialize();
const preferences=loadPreferences(storage),audio=createAudioManager(preferences),session=createFlightSession({readCampaignProgress:()=>progression.state});
const garage=createGarage(storage,()=>{$('status').textContent='Écriture non confirmée : rechargez avant de continuer. Données conservées.';},{readBalance:persistence.balance});
if(persistence.blocked)throw new Error('storage-blocked');
let orientationBlocked=false;
let target=null,keys=new Set(),activePointer=null,renderer,frameId=null;
const missionResults=createMissionResults(progression),defenseHUD=createDefenseHUD(document,audio,{messageFor:(s,message)=>s.over?'Combat terminé':nexusMissionState(s)?.phase===1?'Interceptez les chasseurs · Nexus protégée':message});let lastMissionDifficulty='normal';
const resultView=createMissionResultView($('missionResult'),{replay:()=>start('nexus_m01',lastMissionDifficulty),back:()=>back(),retry:()=>{const result=missionResults.retry(session.run);if(result)resultView.show(result,{focus:false});}});
const galaxy=createGalaxyView($('galaxy'),()=>progression.state,{onLaunch:(id,difficulty)=>start(id,difficulty),canLaunch:()=>!!renderer&&!session.launching&&!orientationBlocked,defaultDifficulty:()=>preferences.difficulty});
function combatInert(value){for(const el of [$('canvas'),document.querySelector('.combat-top'),document.querySelector('.combat-bottom'),$('missionDefense')])el.inert=value;}

const navigation=createNavigation({initial:'galaxy',leave(previous,next){resetInput();if(session.launching)session.cancelStart();if(previous==='galaxy')galaxy.exit();if(next!=='combat'&&frameId!==null){cancelAnimationFrame(frameId);frameId=null;}},enter(screen){
 const combat=screen==='combat';document.body.classList.toggle('in-flight',combat);document.body.classList.toggle('in-garage',screen==='menu');document.body.classList.toggle('on-galaxy',screen==='galaxy');$('menu').hidden=screen!=='menu';$('arena').hidden=!combat;$('galaxy').hidden=screen!=='galaxy';
 if(!orientationBlocked){if(screen==='galaxy'){galaxy.enter();galaxy.focus();}else (combat?canvas:$('ship')).focus({preventScroll:true});}
}});canvas.tabIndex=-1;document.body.classList.add('on-galaxy');galaxy.enter();
for(const [id,catalog] of Object.entries({ship:SHIPS,weapon:WEAPONS,drone:DRONES})){for(const [value,item] of Object.entries(catalog))$(id).add(new Option(item.name,value));$(id).value=garage.profile[id];$(id).onchange=()=>{garage.select(id,$(id).value);describe();};}
function describe(){renderCampaignWeapons($('garageCampaignWeapons'),progression.state);const profile=garage.profile,s=SHIPS[profile.ship];$('spec').textContent=`Blindage ${s.hp} · Vitesse ${s.speed} · Puissance ${s.damage} · Maniabilité ${profile.ship==="wisp"?"vive":profile.ship==="bastion"?"lourde":"équilibrée"}`;$('record').textContent=`Record local : ${profile.best} · Crédits NV2 : ${profile.credits} · Économie inactive`;}
function resetInput(){keys.clear();target=null;const captured=activePointer;activePointer=null;if(captured!==null&&canvas.hasPointerCapture(captured))canvas.releasePointerCapture(captured);const run=session.run;if(run){run.vx=0;run.vy=0;takeEvents(run);}clock.reset();cj.suspend();}
function foreground(){return !persistence.blocked&&!orientationBlocked&&!document.hidden&&document.hasFocus();}
function active(){return session.active(navigation.screen==='combat',foreground());}
function showStartState(){$('mapLaunch').disabled=!renderer||session.launching;$('start').disabled=!renderer||session.launching;if(renderer&&!session.launching)$('start').innerHTML='ENTRER DANS LA FAILLE <b>↗</b>';if(navigation.screen==='galaxy')galaxy.refresh();}
async function start(missionId=null,difficulty=preferences.difficulty){
 if(orientationBlocked||!renderer||session.launching||campaignOptions.open)return;
 $('start').disabled=true;$('mapLaunch').disabled=true;
 try{
  const run=await session.start({...garage.profile,difficulty},async current=>{
   if(preferences.enabled){$('start').textContent='PRÉPARATION AUDIO…';const ready=await audio.unlock();if(!current())return;if(!ready||audio.diagnostics().failed.length)$('status').textContent='Audio indisponible ou incomplet. Son OFF reste disponible.';}
   if(!current())return;audio.stop();await audio.resume();
  },missionId);
  if(!run||run!==session.run)return;
  if(missionId)lastMissionDifficulty=difficulty;
  document.body.classList.toggle('in-mission',!!missionId);$('arena').classList.toggle('mission-flight',!!missionId);$('missionDefense').hidden=!missionId;resultView.hide();combatInert(false);$('flightSector').textContent=missionId?'PREMIÈRE ALERTE':'FAILLE D’AMBRE';
  if(!foreground()){session.pause();audio.suspend();}else audio.play('confirm',{ui:true});
  resetInput();navigation.show('combat');$('restart').hidden=true;$('endActions').hidden=true;resize();run.y=run.height*.76;if(frameId===null)frameId=requestAnimationFrame(frame);
 }catch{audio.stop();$('status').textContent='Préparation du vol indisponible. Réessayez.';}
 finally{showStartState();}
}
function back(){resetInput();resultView.hide();combatInert(false);$('missionDefense').hidden=true;document.body.classList.remove('in-mission');$('arena').classList.remove('mission-flight');session.abandon();audio.stop();audio.play('confirm',{ui:true});navigation.show('galaxy');showStartState();describe();}
$('start').onclick=()=>start();$('restart').onclick=()=>start();$('back').onclick=back;$('endGalaxy').onclick=back;$('garageBack').onclick=back;
$('mapLaunch').onclick=()=>{if(navigation.screen==='galaxy')return start();};
$('openGarage').onclick=()=>{if(navigation.screen!=='galaxy')return;session.cancelStart();audio.stop();navigation.show('menu');showStartState();describe();};
function toggle(){
 if(orientationBlocked||navigation.screen!=='combat'||!session.run||session.run.over)return;
 resetInput();
 if(session.paused){session.resume();const revision=session.revision;audio.resume().then(()=>{if(revision===session.revision&&active())audio.play('confirm',{ui:true});});}
 else{session.pause();audio.pause();}
}
function cycle(){if(active()&&(session.missionId?cycleCampaignWeapon(session.run):cycleWeapon(session.run)))audio.play('confirm',{ui:true,gain:.5});}
$('cycle').onclick=cycle;$('pause').onclick=toggle;$('nova').onclick=()=>{if(active())nova(session.run);};
window.addEventListener('keydown',e=>{if(orientationBlocked||navigation.screen!=='combat'||!session.run||e.target.closest?.('input,select,textarea,[contenteditable]'))return;const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(e.repeat)return;if(k==='p'||k==='escape')toggle();else if(k==='n'){if(active())nova(session.run);}else if(k==='c')cycle();else{keys.add(k);target=null;}});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function aim(e){target=pointer(e.clientX,e.clientY,canvas.getBoundingClientRect());if(e.pointerType!=='mouse')target.y=Math.max(session.run?.spec.size||50,target.y-60);}
canvas.addEventListener('pointerdown',e=>{if(activePointer!==null||!active())return;activePointer=e.pointerId;canvas.setPointerCapture(e.pointerId);aim(e);});
canvas.addEventListener('pointermove',e=>{if(active()&&(e.pointerType==='mouse'||e.pointerId===activePointer))aim(e);});
for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{if(e.pointerId!==activePointer)return;activePointer=null;target=null;});canvas.addEventListener('pointerleave',()=>{if(activePointer===null)target=null;});
function suspend(){galaxy.cancelGestures();session.cancelStart();session.pause();audio.suspend();resetInput();showStartState();}
for(const event of ['blur','pagehide'])window.addEventListener(event,suspend);
document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();else resetInput();});window.addEventListener('focus',resetInput);window.addEventListener('pageshow',resetInput);
function resize(){const run=session.run;if(orientationBlocked||navigation.screen!=='combat'||!run)return;const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,1.5),v=viewport(rect.width,rect.height);canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.max(1,Math.round(rect.height*dpr));(session.missionId?setDefenseBounds:setBounds)(run,v.width,v.height);resetInput();}
window.addEventListener('resize',resize);window.addEventListener('orientationchange',resize);window.visualViewport?.addEventListener('resize',resize);
function frame(now){frameId=null;if(orientationBlocked)return;const run=session.run,paused=session.paused,playing=active();clock.frame(now,playing,dt=>{session.step(dt,{target,dx:Number(keys.has('arrowright')||keys.has('d'))-Number(keys.has('arrowleft')||keys.has('a')||keys.has('q')),dy:Number(keys.has('arrowdown')||keys.has('s'))-Number(keys.has('arrowup')||keys.has('w')||keys.has('z'))},navigation.screen==='combat',foreground());cj.tick(dt*1000);});
 if(navigation.screen==='combat'&&run&&renderer){audio.consume(takeEvents(run),run.width);renderer.render(run);if(session.missionId){defenseHUD.render(run,paused);const mission=nexusMissionState(run);$('missionAnnouncement').textContent=mission.announcement||(mission.breakerSpawned&&!mission.breakerDestroyed?'LE BRISEUR · DERNIÈRE PERCÉE':'');}$('hud').textContent=String(run.score).padStart(6,'0');$('armor').max=run.spec.hp;$('armor').value=run.hp;$('armorText').textContent=`${Math.ceil(run.hp)} / ${run.spec.hp}`;$('phase').textContent=session.missionId&&run.over?(nexusMissionState(run).outcome?.reason==='objectives_met'?'NEXUS / MISSION ACCOMPLIE':'NEXUS / MISSION ÉCHOUÉE'):run.phase;$('timer').textContent=`${String(Math.floor(run.t/60)).padStart(2,'0')}:${String(Math.floor(run.t%60)).padStart(2,'0')}`;$('cycle').innerHTML=WEAPONS[run.loadout.weapon].name+'<small>C / CHANGER</small>';$('cycle').title=WEAPONS[run.loadout.weapon].description;$('cycle').disabled=!!run.ending||!!(session.missionId&&campaignRunWeaponIds(run).length<2);if(session.missionId&&campaignRunWeaponIds(run).length<2){$('cycle').innerHTML=WEAPONS[run.loadout.weapon].name+'<small>ARME AUTORISÉE</small>';$('cycle').title='Autres armes de campagne : victoire Mission 02 et Mission 04.';}$('nova').disabled=!active()||!!run.ending||run.novaCharge<100;$('nova').textContent=run.novaCharge>=100?'NOVA / PRÊTE':`NOVA / ${Math.floor(run.novaCharge)} %`;$('nova').style.setProperty('--charge',run.novaCharge+'%');$('nova').setAttribute('aria-label',`Impulsion NOVA, charge ${Math.floor(run.novaCharge)} pour cent`);$('nova').title='Charge par destructions du pilote ou du drone Alpha. N ou toucher à 100 %.';$('overlay').hidden=active();$('overlay').textContent=run.over?(run.victory?'SPECTRA NEUTRALISÉE\nSECTEUR SÉCURISÉ':'VAISSEAU PERDU\nFIN DE LA DÉMONSTRATION'):paused?'VOL EN PAUSE':'SESSION SUSPENDUE';$('pause').textContent=paused?'Reprendre':'Pause';const result=session.takeResult();if(result){if(session.missionId){const settled=missionResults.settle(run);if(settled){resultView.show(settled);combatInert(true);audio.play(settled.victory?'victory':'explosion_large',{ui:true});}}else{garage.recordResult(result);$('restart').hidden=false;$('endActions').hidden=false;}}if(session.missionId&&run.over)$('overlay').hidden=true;}
 if(navigation.screen==='combat'&&!orientationBlocked&&!(session.missionId&&run?.over))frameId=requestAnimationFrame(frame);}
function showAudio(){ $('soundToggle').textContent=preferences.enabled?'SON ON':'SON OFF';$('soundToggle').setAttribute('aria-pressed',String(preferences.enabled));$('volume').value=Math.round(preferences.volume*100);$('volumeValue').textContent=Math.round(preferences.volume*100)+' %';}
$('difficulty').value=preferences.difficulty;$('difficulty').onchange=()=>{preferences.difficulty=$('difficulty').value;savePreferences(storage,preferences);};
$('soundToggle').onclick=()=>{preferences.enabled=!preferences.enabled;audio.setEnabled(preferences.enabled);if(preferences.enabled)audio.unlock().then(()=>audio.play('confirm',{ui:true}));savePreferences(storage,preferences);showAudio();};
$('volumeOpen').onclick=()=>{const open=$('volumePanel').hidden;$('volumePanel').hidden=!open;$('volumeOpen').setAttribute('aria-expanded',String(open));};
$('volume').oninput=()=>{preferences.volume=Number($('volume').value)/100;audio.setVolume(preferences.volume);savePreferences(storage,preferences);showAudio();};showAudio();
const campaignOptions=createCampaignOptions($('optionsDialog'),{store:progression,canReset:()=>!session.launching&&!session.run,onChanged:()=>{galaxy.refresh();describe();$('status').textContent='';},onClose:()=>{resetInput();}});
$('optionsOpen').onclick=()=>{if(!orientationBlocked&&!session.launching&&!session.run&&navigation.screen==='galaxy')campaignOptions.show();};$('garageOptions').onclick=()=>{if(!orientationBlocked&&!session.launching&&!session.run&&navigation.screen==='menu')campaignOptions.show();};
function orientationChanged(blocked){
 orientationBlocked=blocked;const curtain=$('portraitRequired'),main=document.querySelector('main');
 curtain.hidden=!blocked;main.inert=blocked;if(blocked)main.setAttribute('aria-hidden','true');else main.removeAttribute('aria-hidden');
 if(blocked){campaignOptions.close();suspend();galaxy.exit();if(frameId!==null){cancelAnimationFrame(frameId);frameId=null;}curtain.focus({preventScroll:true});}
 else if(navigation.screen==='galaxy'){galaxy.enter();galaxy.focus();}
 else if(navigation.screen==='combat'){resize();canvas.focus({preventScroll:true});if(frameId===null)frameId=requestAnimationFrame(frame);}
 else $('ship').focus({preventScroll:true});
}
const portraitGuard=createPortraitGuard(orientationChanged);
stopForStorage=()=>{campaignOptions.close();suspend();};
describe();$('start').disabled=true;$('start').textContent='PRÉPARATION DU VOL…';const images=await loadAssets(ASSETS),missing=Object.entries(images).filter(([,i])=>!i).map(([id])=>id);if(missing.length){$('status').textContent='Assets indisponibles : '+missing.join(', ')+'. Rechargez la page.';}else{renderer=createRenderer(canvas,images);showStartState();$('start').innerHTML='ENTRER DANS LA FAILLE <b>↗</b>';}
// Diagnostic en lecture seule, sans raccourci de gameplay ni écriture de sauvegarde.
Object.defineProperty(window,'nv2Diagnostics',{value:()=>{const run=session.run,paused=session.paused;return {threats:run?.nexus?run.enemies.map(e=>({id:e.id,type:e.type,breaker:!!e.breaker,x:e.x,y:e.y,hp:e.hp,bomber:e.defenseBomber?{...e.defenseBomber}:null,warning:e.warning?{...e.warning}:null})):[],campaignWeapons:session.missionId&&run?campaignRunWeaponIds(run):null,missionId:session.missionId,mission:session.missionId&&run?nexusMissionState(run):null,nexus:run?.nexus?.state,progress:progression.diagnostics,screen:navigation.screen,orientationBlocked:portraitGuard.blocked,galaxy:galaxy.diagnostics,launching:session.launching,active:active(),paused,over:run?.over,victory:run?.victory,time:run?.t,hp:run?.hp,ship:run?.loadout.ship,weapon:run?.loadout.weapon,novaCharge:run?.novaCharge,novaUses:run?.stats.novaUses,ending:!!run?.ending,bossPhase:run?.enemies.find(e=>e.boss)?.phase,warningCount:run?.enemies.filter(e=>e.warning).length,velocity:run?{x:run.vx,y:run.vy}:null,stats:run?{...run.stats,bossPhases:[...run.stats.bossPhases]}:null,position:run?{x:run.x,y:run.y}:null,bounds:run?{width:run.width,height:run.height}:null,difficulty:run?.loadout.difficulty||preferences.difficulty,audio:audio.diagnostics(),counts:run?Object.fromEntries(['bullets','hostile','enemies','effects','particles'].map(k=>[k,run[k].length])):{},render:renderer?.metrics(),missing};}});

}
boot().catch(error=>{document.querySelector('main').inert=true;const status=document.getElementById('status');status.textContent='Sauvegarde indisponible ou incompatible ('+(error.code||'storage-unavailable')+'). Fermez les anciens onglets et rechargez. Aucune réinitialisation effectuée.';status.setAttribute('role','alert');});

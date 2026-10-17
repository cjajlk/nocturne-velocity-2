import {SYSTEMS,PREREQUISITES} from './catalog.js';
import {listDestinations} from './unlocks.js';
import {createGalaxyCamera,layoutSystems} from './camera.js';

const roles={base:'Base principale',civilian:'Missions civiles',extraction:'Ressources & extraction',reconnaissance_conquest:'Reconnaissance & conquête',frontline:'Grandes batailles'};
export function createGalaxyView(root,readProgress){
 const $=id=>root.querySelector('#'+id),stage=$('galaxyViewport'),panel=$('destinationPanel'),svg=$('galaxyRoutes'),nodes=new Map();
 const NS=svg.namespaceURI;
 let active=false,controller=null,observer=null,raf=null,selected='nexus',portrait=false,renderCount=0;
 let points=layoutSystems(SYSTEMS),drag=null,multi=false;const pointers=new Map(),camera=createGalaxyCamera(points);
 for(const system of SYSTEMS){
  const button=document.createElement('button');button.type='button';button.className='system-node';button.id='system-'+system.id;button.dataset.system=system.id;
  button.innerHTML='<span class="system-orb" aria-hidden="true"></span><strong></strong><span class="node-state"></span>';
  button.querySelector('strong').textContent=system.name;stage.append(button);nodes.set(system.id,button);
 }
 // Étoiles déterministes et immobiles, vectorielles ; aucun fichier asset créé.
 const stars=$('galaxyStars');for(let i=0;i<85;i++){const star=document.createElementNS(NS,'circle');star.setAttribute('cx',String((i*173.71)%1000));star.setAttribute('cy',String((i*237.19)%700));star.setAttribute('r',i%6===0?'1.5':'.7');star.setAttribute('opacity',String(.15+(i%5)*.12));stars.append(star);}
 const links=[[0,1],[0,2],[1,3],[2,3],[2,4],[3,4]];const paths=links.map(()=>{const p=document.createElementNS(NS,'path');svg.append(p);return p;});
 function conditionView(rule){
  const box=document.createElement('div');box.className='condition-tree';
  if(rule.op==='fact'){box.classList.add('condition-fact');const fact=PREREQUISITES[rule.id];box.textContent=fact?.label||fact?.description||'Condition non disponible.';box.title=fact?.description||'';return box;}
  const heading=document.createElement('p');heading.className='condition-heading';heading.textContent=rule.op==='any'?'Un de ces chemins suffit :':'Plusieurs accomplissements sont requis :';box.append(heading);
  rule.conditions.forEach((child,i)=>{if(i){const join=document.createElement('span');join.className='condition-join';join.textContent=rule.op==='any'?'OU':'ET';box.append(join);}box.append(conditionView(child));});return box;
 }
 function refreshSheet(){
  const view=listDestinations(readProgress()),current=view.find(s=>s.id===selected);
  $('galaxyAccessCount').textContent=`${view.filter(s=>s.access.accessible).length} accès ouverts · ${view.filter(s=>!s.access.accessible).length} verrouillés`;
  for(const system of view){const node=nodes.get(system.id);node.dataset.sector=system.sectorType;node.dataset.access=system.access.status;node.setAttribute('aria-pressed',String(system.id===selected&&!panel.hidden));node.querySelector('.node-state').textContent=system.access.accessible?'ACCESSIBLE':'VERROUILLÉ';node.setAttribute('aria-label',`${system.name}, ${system.access.accessible?'accessible':'verrouillé'}, consulter la fiche`);}
  if(!current)return;$('destinationName').textContent=current.name;$('destinationRole').textContent=roles[current.sectorType]||current.sectorType;$('destinationDescription').textContent=current.description;
  $('destinationStatus').textContent=current.access.accessible?'Accès ouvert':'Système verrouillé';$('destinationStatus').dataset.access=current.access.status;
  const conditions=$('destinationConditions');conditions.replaceChildren();if(!current.access.accessible&&current.access.condition)conditions.append(conditionView(current.access.condition));
  $('missionAvailability').textContent='Missions à venir';$('nexusOperation').hidden=current.id!=='nexus';
 }
 function render(){
  raf=null;if(!active)return;const rect=stage.getBoundingClientRect();if(!rect.width||!rect.height)return;
  const nextPortrait=window.innerHeight>window.innerWidth;
  const usableWidth=Math.max(1,rect.width-140),usableHeight=Math.max(1,rect.height-100);
  points=layoutSystems(SYSTEMS,nextPortrait,nextPortrait?usableHeight/usableWidth:usableWidth/usableHeight);camera.resize(rect.width,rect.height,points,nextPortrait!==portrait);portrait=nextPortrait;
  const projected=points.map(p=>camera.project(p));for(let i=0;i<points.length;i++){const node=nodes.get(points[i].id);node.style.left=projected[i].x+'px';node.style.top=projected[i].y+'px';}
  svg.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);links.forEach(([a,b],i)=>{const p=projected[a],q=projected[b];paths[i].setAttribute('d',`M ${p.x} ${p.y} Q ${(p.x+q.x)/2} ${(p.y+q.y)/2-24} ${q.x} ${q.y}`);});
  $('galaxyZoom').textContent=Math.round(camera.state.zoom*100)+' %';$('mapZoomOut').disabled=camera.state.zoom<=1;$('mapZoomIn').disabled=camera.state.zoom>=3.5;renderCount++;
 }
 function schedule(){if(active&&raf===null)raf=requestAnimationFrame(render);}
 function select(id){if(!nodes.has(id))return;selected=id;panel.hidden=false;root.classList.add('has-selection');refreshSheet();schedule();}
 function close(){panel.hidden=true;root.classList.remove('has-selection');refreshSheet();schedule();nodes.get(selected)?.focus({preventScroll:true});}
 function cancelGestures(){const ids=[...pointers.keys()];pointers.clear();drag=null;multi=false;for(const id of ids)if(stage.hasPointerCapture(id))stage.releasePointerCapture(id);}
 const location=e=>{const r=stage.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
 const pair=()=>{const [a,b]=[...pointers.values()];return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))};};
 function down(e){if(e.pointerType==='mouse'&&e.button!==0)return;const p=location(e);pointers.set(e.pointerId,p);stage.setPointerCapture(e.pointerId);if(pointers.size===1){drag={...p,id:e.target.closest('[data-system]')?.dataset.system,moved:false};}else{multi=true;if(drag)drag.moved=true;}}
 function move(e){
  if(!pointers.has(e.pointerId))return;const p=location(e),old=pointers.get(e.pointerId);
  if(pointers.size>=2){const before=pair();pointers.set(e.pointerId,p);const after=pair();camera.pan(after.x-before.x,after.y-before.y);camera.zoomAt(after.d/before.d,after.x,after.y);schedule();}
  else{pointers.set(e.pointerId,p);if(drag&&Math.hypot(p.x-drag.x,p.y-drag.y)>6)drag.moved=true;if(drag?.moved){camera.pan(p.x-old.x,p.y-old.y);schedule();}}
 }
 function up(e){if(!pointers.has(e.pointerId))return;const click=pointers.size===1&&!multi&&drag&&!drag.moved?drag.id:null;pointers.delete(e.pointerId);if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);if(click)select(click);if(!pointers.size){drag=null;multi=false;}else{const p=[...pointers.values()][0];drag={...p,id:null,moved:true};}}
 function enter(){
  if(active)return;active=true;controller=new AbortController();const signal=controller.signal,on=(el,event,fn,options={})=>el.addEventListener(event,fn,{...options,signal});
  on(stage,'pointerdown',down);on(stage,'pointermove',move);on(stage,'pointerup',up);on(stage,'pointercancel',cancelGestures);on(stage,'lostpointercapture',e=>{if(pointers.has(e.pointerId))cancelGestures();});
  on(stage,'click',e=>{const id=e.target.closest('[data-system]')?.dataset.system;if(e.detail===0&&id)select(id);});
  on(stage,'wheel',e=>{if(e.ctrlKey)return;e.preventDefault();const p=location(e);camera.zoomAt(Math.exp(-Math.max(-150,Math.min(150,e.deltaY))*.002),p.x,p.y);schedule();},{passive:false});
  on($('mapZoomIn'),'click',()=>{camera.zoomAt(1.25);schedule();});on($('mapZoomOut'),'click',()=>{camera.zoomAt(.8);schedule();});on($('mapRecenter'),'click',()=>{camera.recenter();schedule();});on($('closeDestination'),'click',close);
  on(root,'keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();return;}if(!stage.contains(e.target))return;const directions={ArrowLeft:[40,0],ArrowRight:[-40,0],ArrowUp:[0,40],ArrowDown:[0,-40]};if(directions[e.key]){e.preventDefault();camera.pan(...directions[e.key]);schedule();}else if(['+','=','-','Home'].includes(e.key)){e.preventDefault();if(e.key==='Home')camera.recenter();else camera.zoomAt(e.key==='-'?.8:1.25);schedule();}});
  observer=new ResizeObserver(schedule);observer.observe(stage);on(window,'resize',schedule);refreshSheet();schedule();
 }
 function exit(){active=false;cancelGestures();controller?.abort();controller=null;observer?.disconnect();observer=null;if(raf!==null)cancelAnimationFrame(raf);raf=null;}
 return {enter,exit,cancelGestures,focus(){nodes.get(selected)?.focus({preventScroll:true});},get diagnostics(){return {active,selected,panelOpen:!panel.hidden,pointers:pointers.size,pendingFrame:raf!==null,renderCount,camera:camera.state};}};
}

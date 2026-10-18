export function createDefenseHUD(root,audio,{messageFor=(_s,message)=>message}={}){
 const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,root.querySelector('#'+id));return nodes.get(id);};
 const text=(id,value)=>{if(get(id).textContent!==value)get(id).textContent=value;},toggle=(name,value)=>{const classes=get('nexusIntegrity').classList;if(classes.contains(name)!==value)classes.toggle(name,value);};let lastRun=null,message='Interceptez les bombardiers avant la limite.',expires=0,nextSound=0,flashUntil=0,lastIntegrity=100;
 const messages={detected:'Bombardier détecté',approach:'Bombardier proche de la limite',hit:'Nexus touchée',critical:'Intégrité Nexus critique',destroyed:'Nexus détruite'};
 const rank={detected:1,approach:2,hit:3,critical:4,destroyed:5},sounds={detected:'enemy_fire',approach:'ready',hit:'armor_hit',critical:'spectra_phase',destroyed:'explosion_large'};
 return {render(s,paused=false){
  if(lastRun!==s){lastRun=s;message='Interceptez les bombardiers avant la limite.';expires=0;nextSound=0;flashUntil=0;lastIntegrity=100;}
  const state=s.nexus.state,events=s.nexus.takeEvents().sort((a,b)=>rank[b.type]-rank[a.type]);
  if(state.integrity<lastIntegrity)flashUntil=state.time+.45;lastIntegrity=state.integrity;
  if(events.length){const event=events[0];message=messages[event.type];expires=state.time+2.5;if(!paused&&(state.time>=nextSound||rank[event.type]>=3)){audio?.play(sounds[event.type],{ui:true,gain:.45});nextSound=state.time+.65;}}
  if(state.time>expires&&!s.over)message=state.critical?'Intégrité Nexus critique — protégez la station':'Interceptez les bombardiers avant la limite.';
  if(s.over)message=state.destroyed?'Nexus détruite — fin du test technique':'Test terminé — aucune mission validée';
  text('nexusValue',`NEXUS — ${state.integrity} %`);if(get('nexusIntegrity').value!==state.integrity)get('nexusIntegrity').value=state.integrity;toggle('critical',state.critical||state.destroyed);toggle('hit',state.time<flashUntil);text('playerArmor',`BLINDAGE — ${Math.ceil(s.hp)} / ${s.spec.hp}`);text('activeBombers',`${state.activeBombers} bombardier(s)`);
  message=messageFor(s,message);
  if(get('defenseAlert').textContent!==message)get('defenseAlert').textContent=message;
 }};
}

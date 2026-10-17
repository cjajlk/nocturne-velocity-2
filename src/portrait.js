// Règle de présentation uniquement : ne dépend ni du combat ni des sauvegardes.
export function needsPortrait({width,height,coarse,hover}){
 return Number.isFinite(width)&&Number.isFinite(height)&&width>height&&coarse===true&&hover===false;
}
export function createPortraitGuard(onChange){
 const coarse=matchMedia('(pointer: coarse)'),hover=matchMedia('(hover: hover)');let blocked=false;
 const update=()=>{const next=needsPortrait({width:innerWidth,height:innerHeight,coarse:coarse.matches,hover:hover.matches});if(next!==blocked){blocked=next;onChange(blocked);}};
 window.addEventListener('resize',update,{capture:true});window.addEventListener('orientationchange',update,{capture:true});window.visualViewport?.addEventListener('resize',update,{capture:true});coarse.addEventListener('change',update);hover.addEventListener('change',update);update();
 return {get blocked(){return blocked;}};
}

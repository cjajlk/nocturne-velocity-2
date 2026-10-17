export const W=480,H=720,STEP=1/120;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function circleRect(cx,cy,r,x,y,w,h){const dx=cx-clamp(cx,x,x+w),dy=cy-clamp(cy,y,y+h);return dx*dx+dy*dy<=r*r;}
// Espace de jeu adapté au rapport du viewport, sans étirement ni bandes.
export function viewport(width,height){const landscape=width>height;const scale=landscape?height/(height<500?420:720):width/480;return {scale,x:0,y:0,width:width/scale,height:height/scale};}
export function pointer(clientX,clientY,rect){const v=viewport(rect.width,rect.height);return {x:clamp((clientX-rect.left)/v.scale,0,v.width),y:clamp((clientY-rect.top)/v.scale,0,v.height)};}
export function createClock(){let last=null,acc=0;return {reset(){last=null;acc=0;},frame(now,active,update){if(!active){this.reset();return;}if(last===null){last=now;return;}const dt=(now-last)/1000;last=now;if(!Number.isFinite(dt)||dt<0||dt>.2){acc=0;return;}acc+=dt;while(acc+1e-10>=STEP){update(STEP);acc-=STEP;}}};}

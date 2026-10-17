const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function layoutSystems(systems,portrait=false,aspect=null){
 const positions=[[110,280],[300,90],[480,330],[660,100],[820,270]];
 // Adapter la composition au rectangle utile, sans étirer les balises.
 const depth=Number.isFinite(aspect)&&aspect>0?710/aspect/240:1;
 return systems.map((s,i)=>{const [x,y]=positions[i]||[110+i*180,200],v=90+(y-90)*depth;return {id:s.id,x:portrait?v:x,y:portrait?x:v};});
}
export function createGalaxyCamera(initialPoints){
 let points=initialPoints,width=1,height=1,zoom=1,cx=0,cy=0,fit=1,initialized=false;
 function bounds(){return {minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y))};}
 const scale=()=>fit*zoom;
 function project(p){return {x:(p.x-cx)*scale()+width/2,y:(p.y-cy)*scale()+height/2};}
 function constrain(){
  const b=bounds();cx=clamp(cx,b.minX,b.maxX);cy=clamp(cy,b.minY,b.maxY);
  if(!points.some(p=>{const q=project(p);return q.x>=24&&q.x<=width-24&&q.y>=24&&q.y<=height-24;})){
   const nearest=points.reduce((a,p)=>Math.hypot(p.x-cx,p.y-cy)<Math.hypot(a.x-cx,a.y-cy)?p:a,points[0]);
   const rx=Math.max(1,width/2-24)/scale(),ry=Math.max(1,height/2-24)/scale();cx=clamp(cx,nearest.x-rx,nearest.x+rx);cy=clamp(cy,nearest.y-ry,nearest.y+ry);
  }
 }
 function recenter(){const b=bounds();cx=(b.minX+b.maxX)/2;cy=(b.minY+b.maxY)/2;zoom=1;}
 return {
  project,
  resize(w,h,nextPoints=points,transpose=false){
   if(!(w>0&&h>0))return;
   const previous=bounds(),oldCenter=transpose?{x:cy,y:cx}:{x:cx,y:cy};
   const old=transpose?{minX:previous.minY,maxX:previous.maxY,minY:previous.minX,maxY:previous.maxX}:previous;
   const resized=w!==width||h!==height;
   points=nextPoints;width=w;height=h;const b=bounds();fit=Math.max(.05,Math.min(Math.max(1,w-140)/Math.max(1,b.maxX-b.minX),Math.max(1,h-88)/Math.max(1,b.maxY-b.minY)));
   if(!initialized||(resized&&zoom===1)){recenter();initialized=true;}else{
    cx=b.minX+(oldCenter.x-old.minX)/Math.max(1,old.maxX-old.minX)*(b.maxX-b.minX);
    cy=b.minY+(oldCenter.y-old.minY)/Math.max(1,old.maxY-old.minY)*(b.maxY-b.minY);
   }constrain();
  },
  pan(dx,dy){if(!Number.isFinite(dx)||!Number.isFinite(dy))return;cx-=dx/scale();cy-=dy/scale();constrain();},
  zoomAt(factor,x=width/2,y=height/2){
   if(!Number.isFinite(factor)||factor<=0)return;const wx=(x-width/2)/scale()+cx,wy=(y-height/2)/scale()+cy;zoom=clamp(zoom*factor,1,3.5);cx=wx-(x-width/2)/scale();cy=wy-(y-height/2)/scale();constrain();
  },
  recenter,
  get state(){return {width,height,zoom,scale:scale(),center:{x:cx,y:cy}};}
 };
}

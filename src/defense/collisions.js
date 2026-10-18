// Temps d'entrée du segment dans la somme de Minkowski cercle/rectangle de tir (8×22).
const box=(x,y,dx,dy,x0,y0,x1,y1)=>{let lo=0,hi=1;for(const [p,d,a,b] of [[x,dx,x0,x1],[y,dy,y0,y1]]){if(Math.abs(d)<1e-12){if(p<a||p>b)return Infinity;}else{let t=(a-p)/d,u=(b-p)/d;if(t>u)[t,u]=[u,t];lo=Math.max(lo,t);hi=Math.min(hi,u);if(lo>hi)return Infinity;}}return lo;};
export function sweptShot(b0,b1,e0,e1,r){
 const x=b0.x-e0.x,y=b0.y-e0.y,dx=b1.x-e1.x-x,dy=b1.y-e1.y-y;
 let first=Math.min(box(x,y,dx,dy,-4-r,-11,4+r,11),box(x,y,dx,dy,-4,-11-r,4,11+r));
 for(const cx of [-4,4])for(const cy of [-11,11]){const px=x-cx,py=y-cy,c=px*px+py*py-r*r;if(c<=0){first=0;continue;}const a=dx*dx+dy*dy;if(a<1e-16)continue;const b=2*(px*dx+py*dy),disc=b*b-4*a*c;if(disc<0)continue;const t=(-b-Math.sqrt(disc))/(2*a);if(t>=0&&t<=1)first=Math.min(first,t);}
 return first;
}

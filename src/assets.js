export async function loadAssets(manifest){
 const entries=await Promise.all(Object.entries(manifest).map(([key,url])=>new Promise(resolve=>{
 const img=new Image();let done=false;const finish=value=>{if(done)return;done=true;clearTimeout(timer);resolve([key,value]);};
 const timer=setTimeout(()=>finish(null),4000);img.onload=()=>finish(img);img.onerror=()=>finish(null);img.src=url;
 })));return Object.fromEntries(entries);
}

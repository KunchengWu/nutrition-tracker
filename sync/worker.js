// Cloudflare Worker backend for Nutrition Tracker.
// Bind D1 as DB and set SYNC_TOKEN as a Worker secret.
// Do not commit SYNC_TOKEN to GitHub.
const headers = {'content-type':'application/json; charset=utf-8','cache-control':'no-store'};
const reply = (data,status=200)=>new Response(JSON.stringify(data),{status,headers});
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname!=='/api/sync') return new Response('Not found',{status:404});
  if(request.method!=='GET'&&request.method!=='PUT') return reply({error:'Method not allowed'},405);
  if(!env.DB||!env.SYNC_TOKEN) return reply({error:'Sync not configured'},503);
  const provided=request.headers.get('authorization')||'';
  if(provided!==('Bearer '+env.SYNC_TOKEN)) return reply({error:'Unauthorized'},401);
  const user='primary';
  if(request.method==='GET'){
   const row=await env.DB.prepare('SELECT revision,payload,updated_at FROM snapshots WHERE user_id=?').bind(user).first();
   return reply(row?{revision:row.revision,data:JSON.parse(row.payload),updatedAt:row.updated_at}:{revision:0,data:null});
  }
  let body;
  try{body=await request.json()}catch{return reply({error:'Invalid JSON'},400)}
  if(!Number.isSafeInteger(body?.revision)||body.revision<0||!body.data||typeof body.data!=='object'||Array.isArray(body.data)) return reply({error:'Invalid sync data'},400);
  const payload=JSON.stringify(body.data);
  if(payload.length>500000) return reply({error:'Data too large'},413);
  const row=await env.DB.prepare('SELECT revision FROM snapshots WHERE user_id=?').bind(user).first();
  const revision=row?.revision??0;
  if(revision!==body.revision) return reply({error:'Conflict',revision},409);
  if(!row){
   const result=await env.DB.prepare('INSERT OR IGNORE INTO snapshots (user_id,revision,payload,updated_at) VALUES (?,1,?,datetime(\'now\'))').bind(user,payload).run();
   if(!result.meta.changes)return reply({error:'Conflict'},409);
  }else{
   const result=await env.DB.prepare('UPDATE snapshots SET revision=revision+1,payload=?,updated_at=datetime(\'now\') WHERE user_id=? AND revision=?').bind(payload,user,revision).run();
   if(!result.meta.changes)return reply({error:'Conflict'},409);
  }
  return reply({revision:revision+1});
 }
};

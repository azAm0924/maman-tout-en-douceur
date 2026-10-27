import {NextResponse} from 'next/server';import {commerceDb} from '@/lib/commerce-server';import {requestUser,validOrigin} from '@/lib/customer-server';
export const runtime='nodejs';
export async function GET(req:Request){const user=await requestUser(req);if(!user)return NextResponse.json({error:'Non connecté'},{status:401});const db=commerceDb();const {data:admin}=await db.from('admins').select('user_id').eq('user_id',user.id).maybeSingle();if(!admin)return NextResponse.json({error:'Accès refusé'},{status:403});const [{data:profiles,error},{data:orders}]=await Promise.all([db.from('customer_profiles').select('user_id,email,display_name,is_blocked,created_at').order('created_at',{ascending:false}).limit(200),db.from('orders').select('user_id,status,total_cents').not('user_id','is',null).limit(500)]);if(error)return NextResponse.json({error:'Chargement impossible'},{status:503});const counts=new Map<string,{orders:number,spent:number}>();for(const o of orders||[]){if(o.user_id&&o.status==='paid'){const v=counts.get(o.user_id)||{orders:0,spent:0};v.orders++;v.spent+=o.total_cents||0;counts.set(o.user_id,v);}}return NextResponse.json({clients:(profiles||[]).map(p=>({...p,...(counts.get(p.user_id)||{orders:0,spent:0})}))},{headers:{'Cache-Control':'private, no-store'}});}

export async function PATCH(req:Request){
 if(!validOrigin(req))return NextResponse.json({error:'Origine invalide'},{status:403});
 const user=await requestUser(req);if(!user)return NextResponse.json({error:'Non connecté'},{status:401});
 const db=commerceDb();const {data:admin}=await db.from('admins').select('user_id').eq('user_id',user.id).maybeSingle();if(!admin)return NextResponse.json({error:'Accès refusé'},{status:403});
 const {userId,blocked}=await req.json().catch(()=>({}));
 if(typeof userId!=='string'||typeof blocked!=='boolean'||userId===user.id)return NextResponse.json({error:'Modification invalide'},{status:400});
 const {data:target}=await db.from('admins').select('user_id').eq('user_id',userId).maybeSingle();if(target)return NextResponse.json({error:'Un administrateur ne peut pas être suspendu ici'},{status:403});
 const {error}=await db.from('customer_profiles').update({is_blocked:blocked}).eq('user_id',userId);
 if(error)return NextResponse.json({error:'Modification impossible'},{status:503});
 return NextResponse.json({ok:true});
}

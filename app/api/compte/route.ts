import {NextResponse} from 'next/server';
import {commerceDb} from '@/lib/commerce-server';
import {requestUser} from '@/lib/customer-server';
export const runtime='nodejs';
export async function GET(req:Request){
 const user=await requestUser(req);
 if(!user)return NextResponse.json({error:'Connexion requise'},{status:401});
 const db=commerceDb();
 const [{data:orders,error:e1},{data:profile},{data:favorites}]=await Promise.all([
  db.from('orders').select('id,status,created_at,total_cents,subtotal_cents,shipping_cents,fulfillment_status,tracking_url,order_items(id,title,variant,quantity,paid_pdf_path)').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100),
  db.from('customer_profiles').select('display_name').eq('user_id',user.id).maybeSingle(),
  db.from('favorites').select('entry_id,entries(title,slug)').eq('user_id',user.id).limit(100)
 ]);
 if(e1)return NextResponse.json({error:'Impossible de charger les commandes'},{status:503});
 return NextResponse.json({email:user.email,displayName:profile?.display_name,orders,favorites},{headers:{'Cache-Control':'private, no-store'}});
}

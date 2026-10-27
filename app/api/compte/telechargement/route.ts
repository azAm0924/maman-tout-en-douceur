import {NextResponse} from 'next/server';
import {commerceDb} from '@/lib/commerce-server';
import {requestUser,validOrigin} from '@/lib/customer-server';
export const runtime='nodejs';
export async function POST(req:Request){
 if(!validOrigin(req))return NextResponse.json({error:'Origine invalide'},{status:403});
 const user=await requestUser(req);
 if(!user)return NextResponse.json({error:'Connexion requise'},{status:401});
 const {lineId}=await req.json().catch(()=>({}));
 if(typeof lineId!=='string'||!/^[a-f\d-]{36}$/i.test(lineId))return NextResponse.json({error:'Ligne invalide'},{status:400});
 const db=commerceDb();
 const {data:line}=await db.from('order_items').select('paid_pdf_path,variant,orders!inner(user_id,status,digital_consent)').eq('id',lineId).eq('orders.user_id',user.id).maybeSingle();
 const order=Array.isArray(line?.orders)?line?.orders[0]:line?.orders;
 if(!line || !order || order.user_id!==user.id||order.status!=='paid'||!order.digital_consent||line.variant!=='pdf'||!line.paid_pdf_path)
   return NextResponse.json({error:'Téléchargement non disponible'},{status:403});
 const {data,error}=await db.storage.from('paid-downloads').createSignedUrl(line.paid_pdf_path,60,{download:true});
 if(error||!data?.signedUrl)return NextResponse.json({error:'Fichier indisponible'},{status:503});
 return NextResponse.json({url:data.signedUrl},{headers:{'Cache-Control':'private, no-store'}});
}

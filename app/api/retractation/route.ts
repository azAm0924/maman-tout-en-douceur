import {NextResponse} from 'next/server';
import {commerceDb} from '@/lib/commerce-server';
import {requestUser,validOrigin} from '@/lib/customer-server';
export const runtime='nodejs';
export async function POST(req:Request){
 if(!validOrigin(req))return NextResponse.json({error:'Origine non autorisée'},{status:403});
 const user=await requestUser(req);if(!user||!user.email)return NextResponse.json({error:'Connectez-vous pour identifier votre commande'},{status:401});
 const {orderId,confirmed}=await req.json().catch(()=>({}));
 if(confirmed!==true||typeof orderId!=='string'||!/^[a-f0-9-]{36}$/i.test(orderId))return NextResponse.json({error:'Confirmez votre demande de rétractation.'},{status:400});
 const db=commerceDb();
 const {data:order}=await db.from('orders').select('id,user_id,has_physical,created_at,status').eq('id',orderId).eq('user_id',user.id).maybeSingle();
 if(!order || !['paid','refunded'].includes(order.status))return NextResponse.json({error:'Commande introuvable pour ce compte'},{status:404});
 const {data:created,error}=await db.from('withdrawal_requests').upsert({order_id:order.id,user_id:user.id,email:user.email},{onConflict:'order_id',ignoreDuplicates:true}).select('id,created_at,ack_sent_at').maybeSingle();
 if(error)return NextResponse.json({error:'Demande non enregistrée'},{status:503});
 const {data:record}=created?{data:created}:await db.from('withdrawal_requests').select('id,created_at,ack_sent_at').eq('order_id',order.id).eq('user_id',user.id).single();
 if(!record)return NextResponse.json({error:'Demande non disponible'},{status:503});
 if(!record.ack_sent_at && process.env.RESEND_API_KEY && process.env.ORDER_EMAIL_FROM){
  const content=`Accusé de réception de votre demande de rétractation\nMaman tout en douceur\nCommande : ${order.id}\nRéférence de demande : ${record.id}\nDate et heure de réception : ${new Date(record.created_at).toLocaleString('fr-FR',{timeZone:'Europe/Paris'})} (heure de Paris)\nVotre demande est enregistrée. Elle sera examinée selon les droits légaux applicables au(x) produit(s). Cette confirmation ne constitue pas une décision sur son éligibilité ni un remboursement déjà effectué.\nContact : ${process.env.SUPPORT_EMAIL||'voir les mentions légales'}`;
  try{
   const resp=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`withdrawal-${record.id}`},body:JSON.stringify({from:process.env.ORDER_EMAIL_FROM,to:[user.email],subject:`Rétractation reçue — commande ${order.id.slice(0,8)}`,text:content})});
   if(!resp.ok)throw new Error('Confirmation e-mail non envoyée');
   await db.from('withdrawal_requests').update({ack_sent_at:new Date().toISOString()}).eq('id',record.id).is('ack_sent_at',null);
  }catch(e){console.error('Retraction email failed',e);return NextResponse.json({ok:true,id:record.id,created_at:record.created_at,warning:'Demande enregistrée, mais e-mail de réception non envoyé. Contactez le support.'});}
 }
 return NextResponse.json({ok:true,id:record.id,created_at:record.created_at,warning:(!record.ack_sent_at && (!process.env.RESEND_API_KEY||!process.env.ORDER_EMAIL_FROM))?'Demande enregistrée, mais les e-mails ne sont pas configurés. Contactez le support pour obtenir votre accusé.':undefined});
}

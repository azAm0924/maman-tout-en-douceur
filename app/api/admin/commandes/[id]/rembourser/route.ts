import {NextResponse} from 'next/server';
import {commerceDb,stripeServer} from '@/lib/commerce-server';
import {requestUser,validOrigin} from '@/lib/customer-server';
export const runtime='nodejs';
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 if(!validOrigin(req))return NextResponse.json({error:'Origine non autorisée'},{status:403});
 const user=await requestUser(req);if(!user)return NextResponse.json({error:'Connexion requise'},{status:401});
 const db=commerceDb();const {data:admin}=await db.from('admins').select('user_id').eq('user_id',user.id).maybeSingle();
 if(!admin)return NextResponse.json({error:'Accès refusé'},{status:403});
 const {id}=await params;
 if(!/^[a-f0-9-]{36}$/i.test(id))return NextResponse.json({error:'Identifiant invalide'},{status:400});
 const {data:o}=await db.from('orders').select('id,status,stripe_payment_intent_id').eq('id',id).maybeSingle();
 if(o?.status!=='paid'||!o.stripe_payment_intent_id)return NextResponse.json({error:'Commande non remboursable ici'},{status:409});
 try{
  const refund=await stripeServer().refunds.create({payment_intent:o.stripe_payment_intent_id}, {idempotencyKey:`full-refund-${o.id}`});
  return NextResponse.json({id:refund.id,status:refund.status});
 }catch(e){console.error('Refund failed',e);return NextResponse.json({error:'Remboursement refusé par Stripe. Vérifiez le tableau de bord Stripe.'},{status:503});}
}

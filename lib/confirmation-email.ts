import 'server-only';
import {commerceDb} from '@/lib/commerce-server';
export async function sendOrderConfirmation(orderId:string){
 const key=process.env.RESEND_API_KEY, sender=process.env.ORDER_EMAIL_FROM;
 if(!key||!sender){console.warn('Email de confirmation non configuré (Resend)');return;}
 const db=commerceDb();
 const {data:order,error}=await db.from('orders').select('id,email,status,created_at,total_cents,digital_consent,has_physical,confirmation_email_sent_at,order_items(title,variant,quantity,unit_price_cents)').eq('id',orderId).single();
 if(error||!order||order.status!=='paid'||order.confirmation_email_sent_at||!order.email)return;
 const origin=new URL(process.env.NEXT_PUBLIC_SITE_URL||'https://example.com').origin;
 const details=(order.order_items||[]).map((i:{title:string;variant:string;quantity:number;unit_price_cents:number})=>`${i.quantity} × ${i.title} (${i.variant==='pdf'?'PDF numérique':'livret imprimé'}) : ${(i.quantity*i.unit_price_cents/100).toFixed(2)} €`).join('\n');
 const content=`Maman tout en douceur — Confirmation de commande\n\nCommande : ${order.id}\nDate : ${new Date(order.created_at).toLocaleDateString('fr-FR')}\n${details}\nMontant total payé : ${(order.total_cents/100).toFixed(2)} €\n\nConsultez vos achats, téléchargements et le suivi de livraison depuis votre espace personnel : ${origin}/compte\n${order.has_physical?'Vos livrets imprimés seront préparés selon le délai de livraison annoncé avant paiement.\n':''}${order.digital_consent?'Vous avez expressément demandé l’accès immédiat aux contenus numériques et reconnu la perte du droit de rétractation lorsque les conditions légales de l’exception sont réunies.\n':''}\nService client : ${process.env.SUPPORT_EMAIL||'[À CONFIGURER]'}\nCGV applicables à l’achat : ${origin}/cgv\nNote : conserver cette confirmation. Les CGV doivent aussi être fournies sur un support durable avant toute vente réelle.`;
 const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','Idempotency-Key':`order-paid-${order.id}`},body:JSON.stringify({from:sender,to:[order.email],subject:`Votre commande Maman tout en douceur ${order.id.slice(0,8)}`,text:content})});
 if(!response.ok)throw new Error(`Resend refused confirmation (${response.status})`);
 const {error:updateError}=await db.from('orders').update({confirmation_email_sent_at:new Date().toISOString()}).eq('id',orderId).is('confirmation_email_sent_at',null);
 if(updateError)throw updateError;
}

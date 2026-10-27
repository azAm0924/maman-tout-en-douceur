import Link from 'next/link';
import { CheckCircle2, Clock3, Download, PackageCheck } from 'lucide-react';
import { commerceDb, tokenMatches } from '@/lib/commerce-server';
import { euro } from '@/lib/data';
import {ClearCartOnPaid} from '@/components/clear-cart-on-paid';
export const dynamic='force-dynamic';
export const metadata={robots:{index:false,follow:false},title:'Ma commande | Maman tout en douceur'};
export default async function OrderThanks({searchParams}:{searchParams:Promise<{commande?:string;cle?:string}>}) {
  const {commande,cle}=await searchParams;
  let order: Record<string,unknown>|null=null;
  let items:{id:string;title:string;variant:string;quantity:number;paid_pdf_path:string|null}[]=[];
  if (commande && cle && /^[a-f0-9-]{36}$/i.test(commande)) {
    const db=commerceDb();
    const {data}=await db.from('orders').select('*').eq('id',commande).maybeSingle();
    if(data && tokenMatches(cle,data.access_token_hash)){order=data;const result=await db.from('order_items').select('id,title,variant,quantity,paid_pdf_path').eq('order_id',commande);items=result.data??[];}
  }
  if(!order)return <main className="container shop-order"><h1>Commande introuvable</h1><p>Le lien est invalide ou incomplet.</p><Link className="btn btn-outline" href="/ressources">Retour à la boutique</Link></main>;
  const paid=order.status==='paid';
  return <main className="container shop-order">{paid&&<ClearCartOnPaid orderId={String(order.id)}/>}<div className="shop-order-card">{paid?<CheckCircle2 size={43}/>:<Clock3 size={43}/>}<p className="shop-kicker">VOTRE COMMANDE</p><h1>{paid?'Merci pour votre commande !':'Paiement en cours de confirmation'}</h1><p>{paid?'Votre paiement a été confirmé. Retrouvez vos contenus numériques ci-dessous et, si nécessaire, votre livret sera préparé pour expédition.':'La confirmation de paiement est en cours. Actualisez cette page après quelques instants. Aucun fichier payant n’est délivré avant validation du paiement.'}</p><div className="shop-order-items">{items.map(i=><div key={i.id} className="shop-order-item"><span>{i.quantity} × {i.title}<small>{i.variant==='pdf'?'PDF numérique':'Livret imprimé'}</small></span>{paid && i.variant==='pdf' && i.paid_pdf_path && <a className="btn btn-primary" rel="noreferrer" href={`/api/commandes/${commande}/telechargement?ligne=${i.id}&cle=${cle}`}><Download size={16}/> Télécharger</a>}{i.variant==='print' && <PackageCheck size={19}/>}</div>)}</div><strong>Total payé ou attendu : {euro(Number(order.total_cents ?? Number(order.subtotal_cents)+Number(order.shipping_cents)))}</strong><p className="shop-order-note">Conservez cette page : ce lien contient une clé d'accès personnelle à vos achats. Ne le partagez pas. Un e-mail de lien de téléchargement automatique n’est pas encore intégré dans cette version.</p><div className="shop-order-buttons"><Link className="btn btn-outline" href="/ressources">Retour aux créations</Link>{!paid && <a className="btn btn-primary" href={`?commande=${commande}&cle=${cle}`}>Vérifier le paiement</a>}</div></div></main>;
}

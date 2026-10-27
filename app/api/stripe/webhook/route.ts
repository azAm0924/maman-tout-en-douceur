import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { commerceDb, stripeServer } from '@/lib/commerce-server';
import {sendOrderConfirmation} from '@/lib/confirmation-email';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return NextResponse.json({error:'Signature manquante'}, {status:400});
  let event: Stripe.Event;
  try { event = stripeServer().webhooks.constructEvent(await request.text(),sig,secret); }
  catch { return NextResponse.json({error:'Signature invalide'}, {status:400}); }
  try {
    const db = commerceDb();
    if (['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','checkout.session.expired'].includes(event.type)) {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      if (!orderId) return NextResponse.json({received:true});
      if (event.type === 'checkout.session.completed' && session.payment_status !== 'paid') return NextResponse.json({received:true});
      if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
        if (session.payment_status !== 'paid') return NextResponse.json({received:true});
        const {data:order,error:readError} = await db.from('orders').select('id,subtotal_cents,shipping_cents,status,stripe_checkout_session_id').eq('id',orderId).single();
        if (readError || !order) throw new Error('Commande inconnue');
        if (order.stripe_checkout_session_id && order.stripe_checkout_session_id !== session.id) throw new Error('Incohérence Checkout ID');
        if (session.currency !== 'eur' || session.amount_total !== order.subtotal_cents + order.shipping_cents) throw new Error('Total de commande incohérent');
        if (order.status === 'refunded') return NextResponse.json({received:true});
        const details = session.customer_details;
        const shipping = (session as unknown as {collected_information?:{shipping_details?:unknown};shipping_details?:unknown}).collected_information?.shipping_details ?? (session as unknown as {shipping_details?:unknown}).shipping_details ?? null;
        const { error } = await db.from('orders').update({status:'paid',paid_at:new Date().toISOString(),email:details?.email ?? null,customer_name:details?.name ?? null,shipping_address:shipping ?? details?.address ?? null, stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null,total_cents:session.amount_total}).eq('id',orderId).in('status',['pending','failed','expired']);
        if (error) throw error;
        await sendOrderConfirmation(orderId);
      } else {
        const status = event.type === 'checkout.session.expired' ? 'expired' : 'failed';
        const {error:releaseError}=await db.rpc('release_order_stock',{p_order_id:orderId});
        if(releaseError) throw releaseError;
        const {error}=await db.from('orders').update({status}).eq('id',orderId).eq('status','pending');
        if(error)throw error;
      }
    }
    if(event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntent = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
      if(paymentIntent && charge.refunded) {
        const {error}=await db.from('orders').update({status:'refunded'}).eq('stripe_payment_intent_id',paymentIntent);
        if(error) throw error;
      }
    }
    return NextResponse.json({received:true});
  } catch(err) {
    console.error('Stripe webhook processing failure',err);
    // 500 = Stripe recommencera le webhook. Ne jamais donner accès à un PDF sur la page succès seule.
    return NextResponse.json({error:'Traitement non terminé'}, {status:500});
  }
}

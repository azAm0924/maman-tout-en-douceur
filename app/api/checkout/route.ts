import { NextResponse } from 'next/server';
import { commerceDb, getShippingCents, newOrderToken, stripeServer, tokenHash } from '@/lib/commerce-server';
import { requestUser, stripeCustomerFor } from '@/lib/customer-server';

export const runtime = 'nodejs';

type CartLine = { entryId: string; variant: 'pdf' | 'print'; quantity: number };
const isUUID = (s: string) => /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(s);

export async function POST(req: Request) {
  // Les prix viennent toujours de Supabase, jamais du navigateur.
  try {
    const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL;
    if (!configuredOrigin) throw new Error('NEXT_PUBLIC_SITE_URL absent');
    const origin = new URL(configuredOrigin).origin;
    if (req.headers.get('origin') !== origin || new URL(req.url).origin !== origin) return NextResponse.json({ error: 'Origine non autorisée.' }, { status: 403 });
    if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') && (!process.env.RESEND_API_KEY || !process.env.ORDER_EMAIL_FROM || !process.env.SUPPORT_EMAIL)) return NextResponse.json({error:'Les confirmations e-mail doivent être configurées avant le paiement réel.'},{status:503});
    if (process.env.COMMERCE_ENABLED !== 'true') return NextResponse.json({error:'La boutique est en préparation.'},{status:503});
    const user = await requestUser(req);
    if (!user || !user.email_confirmed_at) return NextResponse.json({error:'Connectez-vous avec une adresse e-mail confirmée avant de commander.'},{status:401});
    const {data:profile}=await commerceDb().from('customer_profiles').select('is_blocked').eq('user_id',user.id).maybeSingle();
    if(profile?.is_blocked)return NextResponse.json({error:'Votre compte est temporairement suspendu. Contactez le service client.'},{status:403});
    const payload = await req.json();
    const items = payload?.items as CartLine[];
    if (!Array.isArray(items) || !items.length || items.length > 20 || items.some(i => !i || !isUUID(i.entryId) || !['pdf','print'].includes(i.variant) || !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 10)) {
      return NextResponse.json({ error: 'Panier incorrect.' }, { status: 400 });
    }
    const unique = new Set(items.map(i => `${i.entryId}:${i.variant}`));
    if (items.some(i=>i.variant==='pdf'&&i.quantity!==1)) return NextResponse.json({error:'Un PDF ne peut être acheté qu’en un exemplaire par commande.'},{status:400});
    if (unique.size !== items.length) return NextResponse.json({ error: 'Articles en double.' }, { status: 400 });
    const db = commerceDb();
    const ids = [...new Set(items.map(i => i.entryId))];
    const { data: entries, error: entriesError } = await db.from('entries').select('id,title,kind,published,is_hidden,print_stock,pdf_for_sale,pdf_price_cents,print_for_sale,print_price_cents,paid_pdf_path').in('id',ids);
    if (entriesError || !entries || entries.length !== ids.length) return NextResponse.json({ error: 'Un support est introuvable.' }, { status: 400 });
    const prices = [] as { entry_id: string; title: string; variant: 'pdf'|'print'; quantity: number; unit_price_cents: number; paid_pdf_path: string | null }[];
    for (const item of items) {
      const entry = entries.find(e => e.id === item.entryId);
      if (!entry || !entry.published || entry.is_hidden || entry.kind !== 'ressource') return NextResponse.json({ error: 'Un article est indisponible.' }, { status: 400 });
      const price = item.variant === 'pdf' ? entry.pdf_price_cents : entry.print_price_cents;
      const enabled = item.variant === 'pdf' ? entry.pdf_for_sale : entry.print_for_sale;
      if (!enabled || typeof price !== 'number' || !Number.isSafeInteger(price) || price < 50 || (item.variant === 'pdf' && !entry.paid_pdf_path)) return NextResponse.json({ error: 'Un format est indisponible.' }, { status: 400 });
      if(item.variant === 'print' && entry.print_stock !== null && entry.print_stock < item.quantity) return NextResponse.json({error:'Stock insuffisant pour ce livret.'},{status:409});
      prices.push({ entry_id: entry.id, title: entry.title, variant: item.variant, quantity: item.quantity, unit_price_cents: price, paid_pdf_path: item.variant === 'pdf' ? entry.paid_pdf_path : null });
    }
    const digital = prices.some(i=>i.variant === 'pdf');
    const hasPhysical = prices.some(i=>i.variant === 'print');
    if (payload?.acceptedTerms !== true || (digital && payload?.digitalConsent !== true)) return NextResponse.json({ error: 'Veuillez accepter les conditions applicables à votre commande.' }, { status: 400 });
    const subtotal = prices.reduce((sum,i)=>sum+i.unit_price_cents*i.quantity,0);
    if (subtotal > 10000000) return NextResponse.json({ error: 'Montant trop élevé.' }, { status: 400 });
    const token = newOrderToken();
    const shipping = hasPhysical ? getShippingCents() : 0;
    const { data: order, error: orderError } = await db.from('orders').insert({ subtotal_cents:subtotal, shipping_cents: shipping, has_physical: hasPhysical, digital_consent: digital && payload.digitalConsent, consented_at: digital ? new Date().toISOString() : null, access_token_hash: tokenHash(token), user_id:user.id, email:user.email }).select('id').single();
    if (orderError || !order) throw new Error('Création de la commande impossible');
    let createdSessionId: string | null = null;
    try {
      const { error: itemsError } = await db.from('order_items').insert(prices.map(i=>({ order_id:order.id, ...i })));
      if (itemsError) throw itemsError;
      const {error:stockError}=await db.rpc('reserve_order_stock',{p_order_id:order.id});
      if(stockError) throw new Error('Stock indisponible : '+stockError.message);
      const stripe = stripeServer();
      const customerId = await stripeCustomerFor(user);
      const session = await stripe.checkout.sessions.create({
        mode:'payment', locale:'fr', client_reference_id:order.id,
        metadata:{ order_id:order.id },
        line_items:prices.map(i=>({ quantity:i.quantity, price_data:{ currency:'eur', unit_amount:i.unit_price_cents, product_data:{ name:`${i.title} — ${i.variant === 'pdf' ? 'PDF numérique' : 'Livret imprimé'}` } } })),
        ...(hasPhysical ? {
          shipping_address_collection:{ allowed_countries:['FR'] as ['FR'] },
          shipping_options:[{ shipping_rate_data:{ type:'fixed_amount' as const, fixed_amount:{amount:shipping,currency:'eur'},display_name:'Livraison en France', } }],
          phone_number_collection:{enabled:true},
        } : {}),
        customer:customerId,
        saved_payment_method_options:{payment_method_save:'enabled',allow_redisplay_filters:['always','limited','unspecified']},
        success_url:`${origin}/commande/merci?commande=${order.id}&cle=${token}`,
        cancel_url:`${origin}/panier?annule=1`,
      },{ idempotencyKey:`checkout-${order.id}` });
      createdSessionId = session.id;
      const { error: updateError }=await db.from('orders').update({stripe_checkout_session_id:session.id}).eq('id',order.id);
      if (updateError) throw updateError;
      if (!session.url) throw new Error('Stripe ne fournit pas de page de paiement');
      return NextResponse.json({url:session.url,orderId:order.id});
    } catch(err) {
      // Commande en attente jamais réglée, nettoyée si aucune session exploitable n'est retournée.
      console.error('checkout failure',err);
      let safeToRelease=!createdSessionId;
      if (createdSessionId) { try { await stripeServer().checkout.sessions.expire(createdSessionId); safeToRelease=true; } catch(expireError){ console.error('Session Stripe à expirer manuellement ; stock conservé',createdSessionId,expireError); } }
      if(safeToRelease) await db.rpc('release_order_stock',{p_order_id:order.id});
      if(!createdSessionId) await db.from('orders').delete().eq('id',order.id).eq('status','pending');
      throw err;
    }
  } catch(err) {
    console.error('checkout error',err);
    return NextResponse.json({error:'Paiement temporairement indisponible. Réessayez.'},{status:500});
  }
}

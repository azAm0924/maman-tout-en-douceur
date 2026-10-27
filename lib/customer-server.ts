import 'server-only';
import { commerceDb, stripeServer } from '@/lib/commerce-server';
import type { User } from '@supabase/supabase-js';

export async function requestUser(req: Request): Promise<User | null> {
  const token = /^Bearer (.+)$/i.exec(req.headers.get('authorization') || '')?.[1];
  if (!token || token.length > 4096) return null;
  const { data, error } = await commerceDb().auth.getUser(token);
  return error ? null : data.user;
}
export function validOrigin(req: Request) {
  try {
    const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL || '').origin;
    return req.headers.get('origin') === origin && new URL(req.url).origin === origin;
  } catch { return false; }
}
export async function stripeCustomerFor(user: User) {
  const db = commerceDb();
  const { data: row } = await db.from('customer_profiles').select('stripe_customer_id').eq('user_id',user.id).maybeSingle();
  if (row?.stripe_customer_id) return row.stripe_customer_id as string;
  if (!user.email) throw new Error('Adresse e-mail du compte requise');
  const customer = await stripeServer().customers.create({email:user.email,metadata:{supabase_user_id:user.id}}, {idempotencyKey:`mted-customer-${user.id}`});
  const { error } = await db.from('customer_profiles').upsert({user_id:user.id,email:user.email,stripe_customer_id:customer.id},{onConflict:'user_id',ignoreDuplicates:false});
  if (error) throw error;
  return customer.id;
}

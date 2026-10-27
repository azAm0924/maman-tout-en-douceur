import 'server-only';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export function commerceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY absent');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function stripeServer() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY absent');
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export function newOrderToken() { return randomBytes(32).toString('hex'); }
export function tokenHash(token: string) { return createHash('sha256').update(token).digest('hex'); }
export function tokenMatches(token: string, hash: string) {
  if (!/^[a-f0-9]{64}$/.test(token) || !/^[a-f0-9]{64}$/.test(hash)) return false;
  return timingSafeEqual(Buffer.from(tokenHash(token), 'hex'), Buffer.from(hash, 'hex'));
}

export function getShippingCents() {
  const value = Number(process.env.SHIPPING_FEE_CENTS ?? 490);
  if (!Number.isSafeInteger(value) || value < 0 || value > 100000) throw new Error('SHIPPING_FEE_CENTS invalide');
  return value;
}

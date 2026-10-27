import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type EntryKind = 'article' | 'ressource';
export const categories = ['Grossesse', 'Naissance', 'Post-partum', 'Nouveau-né', 'Allaitement', 'Éveil & activités', 'Bien-être', 'Autonomie & routines', 'Apprentissages', 'Émotions', 'Organisation'] as const;
export type Entry = {
  id: string;
  kind: EntryKind;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  cover_path: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
  support_type?: 'livret' | 'fiche' | 'kit' | 'guide';
  audience?: string | null;
  page_count?: number | null;
  is_featured?: boolean;
  is_hidden?: boolean;
  print_stock?: number | null;
  pdf_for_sale?: boolean;
  pdf_price_cents?: number | null;
  print_for_sale?: boolean;
  print_price_cents?: number | null;
  paid_pdf_path?: string | null;
  paid_pdf_name?: string | null;
};

let browserClient: SupabaseClient | null = null;
const config = () => ({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});

export function getBrowserClient() {
  const { url, key } = config();
  if (!url || !key || url.includes('YOUR_PROJECT')) return null;
  if (!browserClient) browserClient = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
  return browserClient;
}

export function getServerClient() {
  const { url, key } = config();
  if (!url || !key || url.includes('YOUR_PROJECT')) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function getPublished(kind?: EntryKind, limit?: number): Promise<Entry[]> {
  const client = getServerClient();
  if (!client) return [];
  let query = client.from('entries').select('*').eq('published', true).order('created_at', { ascending: false });
  if (kind) query = query.eq('kind', kind);
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) { console.error('Erreur de chargement:', error.message); return []; }
  return (data ?? []) as Entry[];
}

export async function getArticle(slug: string): Promise<Entry | null> {
  const client = getServerClient();
  if (!client) return null;
  const { data } = await client.from('entries').select('*').eq('published', true).eq('kind', 'article').eq('slug', slug).maybeSingle();
  return (data as Entry | null) ?? null;
}

export function publicFileUrl(path: string | null): string | null {
  const { url } = config();
  if (!url || !path) return null;
  const safePath = path.split('/').map(encodeURIComponent).join('/');
  return `${url}/storage/v1/object/public/publications/${safePath}`;
}

export function supportTypeLabel(type?: string | null) {
  return ({ livret: 'Livret', fiche: 'Fiche pratique', kit: 'Kit & activité', guide: 'Guide' } as Record<string, string>)[type || 'fiche'] || 'Support pédagogique';
}

export async function getResource(slug: string): Promise<Entry | null> {
  const client = getServerClient();
  if (!client) return null;
  const { data, error } = await client.from('entries').select('*').eq('published', true).eq('kind', 'ressource').eq('slug', slug).maybeSingle();
  if (error) { console.error('Erreur lors du chargement du support:', error.message); return null; }
  return (data as Entry | null) ?? null;
}

export function prettyDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}

export function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90);
}

export function euro(cents: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

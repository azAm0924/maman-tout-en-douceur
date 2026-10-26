import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type EntryKind = 'article' | 'ressource';
export const categories = ['Grossesse', 'Naissance', 'Post-partum', 'Nouveau-né', 'Allaitement', 'Éveil & activités', 'Bien-être'] as const;
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

export function prettyDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}

export function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90);
}

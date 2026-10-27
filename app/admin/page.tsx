'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FilePlus2, LogOut, Pencil, Trash2, Save, RotateCcw } from 'lucide-react';
import { categories, getBrowserClient, type Entry, type EntryKind, slugify } from '@/lib/data';
import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'publications';
const PAID_BUCKET = 'paid-downloads';
const FILE_LIMIT = 15 * 1024 * 1024; // 15 Mo; TUS recommandé pour les gros fichiers en production.
const COVER_LIMIT = 6 * 1024 * 1024;
const validAttachments = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']);
const validImages = new Set(['image/jpeg', 'image/png', 'image/webp']);
const mimeByExtension: Record<string, string> = {
  pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};
function mimeFor(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return file.type || mimeByExtension[ext] || '';
}

type Draft = {
  kind: EntryKind; title: string; slug: string; excerpt: string; body: string; category: string;
  published: boolean; cover_path: string | null; attachment_path: string | null; attachment_name: string | null;
  support_type: 'livret' | 'fiche' | 'kit' | 'guide'; audience: string; page_count: number | null; is_featured: boolean;
  is_hidden:boolean; print_stock:number|null;
  pdf_for_sale: boolean; pdf_price_cents: number | null; print_for_sale: boolean; print_price_cents: number | null; paid_pdf_path: string | null; paid_pdf_name: string | null;
};
function newDraft(): Draft { return { kind: 'ressource', title: '', slug: '', excerpt: '', body: '', category: 'Éveil & activités', published: false, cover_path: null, attachment_path: null, attachment_name: null, support_type: 'livret', audience: '', page_count: null, is_featured: false,is_hidden:false,print_stock:null, pdf_for_sale:false, pdf_price_cents:null,print_for_sale:false,print_price_cents:null,paid_pdf_path:null,paid_pdf_name:null }; }

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [rows, setRows] = useState<Entry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(newDraft);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [paidPdfFile, setPaidPdfFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [fileKey, setFileKey] = useState(0);
  const [checkAttempt, setCheckAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    const db = getBrowserClient();
    if (!db) { setError('Supabase non configuré : voir le fichier README.md.'); setLoading(false); return; }
    void (async () => {
      // getSession lit la session persistante Supabase même après navigation/rechargement.
      // Les droits d'écriture restent sécurisés côté Supabase par les policies RLS.
      const { data: { session }, error: sessionError } = await db.auth.getSession();
      if (!current) return;
      if (sessionError) throw new Error('Impossible de vérifier la session. Réessayez.');
      if (!session) { router.replace('/connexion'); return; }
      const { data: admin, error: authError } = await db.rpc('is_admin');
      if (!current) return;
      // IMPORTANT : une erreur réseau/RPC ne doit jamais entraîner un signOut().
      if (authError) throw new Error('Vérification des droits indisponible. Réessayez sans vous déconnecter.');
      if (!admin) { setError('Ce compte ne possède pas les droits administrateur.'); setLoading(false); return; }
      setAuthorized(true);
      const { data, error: listError } = await db.from('entries').select('*').order('created_at', { ascending: false }).limit(300);
      if (!current) return;
      if (listError) setError(listError.message);
      else setRows((data ?? []) as Entry[]);
      setLoading(false);
    })().catch(err => { if (current) { setError(err instanceof Error ? err.message : 'Erreur de connexion'); setLoading(false); } });
    return () => { current = false; };
  }, [router, checkAttempt]);

  async function refresh(db: SupabaseClient) {
    const { data, error: loadError } = await db.from('entries').select('*').order('created_at', { ascending: false }).limit(300);
    if (loadError) throw loadError;
    setRows((data ?? []) as Entry[]);
    router.refresh();
  }
  function resetForm() {
    setEditingId(null); setDraft(newDraft()); setCoverFile(null); setAttachmentFile(null); setPaidPdfFile(null); setFileKey(k => k + 1); setError(''); setMessage('');
  }
  function edit(entry: Entry) {
    setEditingId(entry.id);
    setDraft({ kind: entry.kind, title: entry.title, slug: entry.slug, excerpt: entry.excerpt, body: entry.body, category: entry.category, published: entry.published, cover_path: entry.cover_path, attachment_path: entry.attachment_path, attachment_name: entry.attachment_name, support_type: entry.support_type || 'fiche', audience: entry.audience || '', page_count: entry.page_count ?? null, is_featured: Boolean(entry.is_featured),is_hidden:Boolean(entry.is_hidden),print_stock:entry.print_stock??null, pdf_for_sale:Boolean(entry.pdf_for_sale),pdf_price_cents:entry.pdf_price_cents??null,print_for_sale:Boolean(entry.print_for_sale),print_price_cents:entry.print_price_cents??null,paid_pdf_path:entry.paid_pdf_path??null,paid_pdf_name:entry.paid_pdf_name??null });
    setCoverFile(null); setAttachmentFile(null); setPaidPdfFile(null); setFileKey(k => k + 1); setError(''); setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function update<K extends keyof Draft>(key: K, value: Draft[K]) { setDraft(d => ({ ...d, [key]: value })); }
  async function upload(db: SupabaseClient, file: File, directory: 'covers' | 'files' | 'premium', privateFile = false): Promise<string> {
    const extension = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${directory}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await db.storage.from(privateFile ? PAID_BUCKET : BUCKET).upload(path, file, { upsert: false, contentType: mimeFor(file), cacheControl: '3600' });
    if (uploadError) throw new Error(`Impossible d'envoyer ${file.name} : ${uploadError.message}`);
    return path;
  }
  function checkFile(file: File | null, cover = false) {
    if (!file) return '';
    const validTypes = cover ? validImages : validAttachments;
    if (!validTypes.has(mimeFor(file))) return `Format non autorisé : ${file.name}`;
    if (file.size > (cover ? COVER_LIMIT : FILE_LIMIT)) return `Fichier trop volumineux : ${file.name} (maximum ${cover ? 6 : 15} Mo).`;
    return '';
  }
  function chooseCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    const issue = checkFile(file, true); if (issue) { setError(issue); event.target.value = ''; return; }
    setError(''); setCoverFile(file);
  }
  function chooseAttachment(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    const issue = checkFile(file); if (issue) { setError(issue); event.target.value = ''; return; }
    setError(''); setAttachmentFile(file);
  }
  function choosePaidPdf(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (file && (mimeFor(file) !== 'application/pdf' || file.size > 50*1024*1024)) { setError('PDF payant : fichier PDF uniquement, 50 Mo maximum.'); event.target.value=''; return; }
    setError(''); setPaidPdfFile(file);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage('');
    const db = getBrowserClient(); if (!db) return;
    if (!draft.title.trim() || !draft.excerpt.trim() || !slugify(draft.slug || draft.title)) { setError('Titre, résumé et adresse valide sont obligatoires.'); return; }
    if (draft.kind === 'article' && !draft.body.trim()) { setError('Le texte de l’article est obligatoire.'); return; }
    // Le fichier payant est conservé exclusivement dans paid-downloads, jamais dans publications.
    if (draft.kind === 'ressource') {
      if (draft.pdf_for_sale && (!draft.pdf_price_cents || draft.pdf_price_cents < 50 || !Number.isInteger(draft.pdf_price_cents))) {setError('Indiquer un prix PDF valide, en centimes.');return;}
      if (draft.print_for_sale && (!draft.print_price_cents || draft.print_price_cents < 50 || !Number.isInteger(draft.print_price_cents))) {setError('Indiquer un prix livret valide, en centimes.');return;}
      if (draft.published && draft.pdf_for_sale && !paidPdfFile && !draft.paid_pdf_path) {setError('Ajoute le PDF privé avant de publier sa version payante.');return;}
    }
    for (const [file, cover] of [[coverFile, true], [attachmentFile, false]] as const) { const issue = checkFile(file, cover); if (issue) { setError(issue); return; } }
    setBusy(true);
    const uploaded: string[] = [];
    try {
      let cover_path = draft.cover_path;
      let attachment_path = draft.attachment_path;
      let attachment_name = draft.attachment_name;
      let paid_pdf_path = draft.paid_pdf_path;
      let paid_pdf_name = draft.paid_pdf_name;
      if (coverFile) { cover_path = await upload(db, coverFile, 'covers'); uploaded.push(cover_path); }
      if (attachmentFile) { attachment_path = await upload(db, attachmentFile, 'files'); attachment_name = attachmentFile.name; uploaded.push(attachment_path); }
      if (paidPdfFile) { paid_pdf_path = await upload(db, paidPdfFile, 'premium', true); paid_pdf_name = paidPdfFile.name; uploaded.push(`PRIVATE:${paid_pdf_path}`); }
      const payload = {
        kind: draft.kind, title: draft.title.trim(), slug: slugify(draft.slug || draft.title),
        excerpt: draft.excerpt.trim(), body: draft.body.trim(), category: draft.category, published: draft.published,
        cover_path, attachment_path, attachment_name,
        support_type: draft.support_type, audience: draft.audience.trim() || null,
        page_count: draft.page_count, is_featured: draft.is_featured, is_hidden:draft.is_hidden, print_stock:draft.print_stock,
        pdf_for_sale:draft.kind==='ressource' && draft.pdf_for_sale, pdf_price_cents:draft.kind==='ressource'&&draft.pdf_for_sale?draft.pdf_price_cents:null,
        print_for_sale:draft.kind==='ressource'&&draft.print_for_sale, print_price_cents:draft.kind==='ressource'&&draft.print_for_sale?draft.print_price_cents:null,
        paid_pdf_path: paid_pdf_path,paid_pdf_name:paid_pdf_name,
      };
      const { error: saveError } = editingId ? await db.from('entries').update(payload).eq('id', editingId) : await db.from('entries').insert(payload);
      if (saveError) throw new Error(saveError.code === '23505' ? 'Cette adresse (slug) existe déjà. Choisissez-en une autre.' : saveError.message);
      setMessage(editingId ? 'Publication modifiée.' : 'Publication créée.');
      setEditingId(null); setDraft(newDraft()); setCoverFile(null); setAttachmentFile(null); setPaidPdfFile(null); setFileKey(k => k + 1);
      await refresh(db);
    } catch (err) {
      if (uploaded.length) { const publicFiles=uploaded.filter(x=>!x.startsWith('PRIVATE:')); const privateFiles=uploaded.filter(x=>x.startsWith('PRIVATE:')).map(x=>x.slice(8)); if(publicFiles.length)await db.storage.from(BUCKET).remove(publicFiles);if(privateFiles.length)await db.storage.from(PAID_BUCKET).remove(privateFiles); }
      setError(err instanceof Error ? err.message : 'Échec de l’enregistrement.');
    } finally { setBusy(false); }
  }
  async function deleteEntry(entry: Entry) {
    if (!window.confirm(`Supprimer « ${entry.title} » du catalogue ? Les PDF privés déjà vendus seront conservés pour les anciens acheteurs.`)) return;
    const db = getBrowserClient(); if (!db) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const { error: deleteError } = await db.from('entries').delete().eq('id', entry.id);
      if (deleteError) throw deleteError;
      const paths = [entry.cover_path, entry.attachment_path].filter((path): path is string => Boolean(path));
      if (paths.length) {
        const { error: storageError } = await db.storage.from(BUCKET).remove(paths);
        if (storageError) setError(`Publication supprimée, mais les fichiers doivent être nettoyés manuellement : ${storageError.message}`);
      }
      setMessage('Publication supprimée.');
      if (editingId === entry.id) resetForm();
      await refresh(db);
    } catch (err) { setError(err instanceof Error ? err.message : 'Suppression impossible.'); }
    finally { setBusy(false); }
  }
  async function signOut() { await getBrowserClient()?.auth.signOut(); router.replace('/connexion'); router.refresh(); }
  if (loading) return <div className="auth-shell"><div className="auth-card"><p>Vérification de votre accès…</p></div></div>;
  if (!authorized) return <div className="auth-shell"><div className="auth-card"><h1>Accès privé</h1><p>{error || 'Redirection vers la connexion…'}</p><div className="admin-actions"><button type="button" className="btn btn-primary" onClick={() => { setLoading(true); setError(''); setCheckAttempt(n => n + 1); }}>Réessayer</button><Link href="/connexion" className="btn btn-outline">Page de connexion</Link></div></div></div>;
  return <section className="admin-main"><div className="container">
    <div className="admin-header"><div><p className="eyebrow">ESPACE ADMINISTRATION</p><h1>Mon petit <em>atelier</em></h1><p className="admin-note">Gérer vos livrets, fiches, supports et conseils. Retrouvez cet espace à tout moment via « Mon espace » en haut du site.</p></div><div className="admin-actions"><Link href="/" className="btn btn-outline"><ArrowLeft size={15}/> Voir le site</Link><Link href="/admin/commandes" className="btn btn-outline">Commandes et expéditions</Link><Link href="/admin/avis" className="btn btn-outline">Avis clients</Link><Link href="/admin/clients" className="btn btn-outline">Clients</Link><Link href="/admin/retractations" className="btn btn-outline">Rétractations</Link><button className="btn btn-outline" onClick={signOut} type="button"><LogOut size={15}/> Déconnexion</button></div></div>
    {error && <div role="alert" className="error-box">{error}</div>}{message && <div role="status" className="success-box">{message}</div>}
    <div className="admin-columns"><aside className="admin-panel"><h2>Mes publications ({rows.length})</h2><p className="admin-note">Cliquez sur Modifier pour retrouver un contenu.</p><button type="button" className="btn btn-outline" onClick={resetForm} style={{ marginBottom: 20 }}><FilePlus2 size={16}/> Nouvelle publication</button>
    <div className="admin-list">{rows.length ? rows.map(row => <div className="admin-entry" key={row.id}><div><strong>{row.title}</strong><small>{row.kind === 'article' ? 'Conseil' : 'Création'} · {row.is_hidden ? 'Masqué' : row.published ? (row.print_for_sale && row.print_stock===0?'En ligne · rupture stock':'En ligne') : 'Brouillon'}</small></div><div style={{ display: 'flex', gap: 5, flexShrink: 0 }}><button type="button" className="tiny-button" onClick={() => edit(row)} disabled={busy} title="Modifier"><Pencil size={14}/></button><button type="button" className="tiny-button danger" onClick={() => deleteEntry(row)} disabled={busy} title="Supprimer"><Trash2 size={14}/></button></div></div>) : <p className="admin-note">Aucune publication pour le moment.</p>}</div></aside>
    <div className="admin-panel"><h2>{editingId ? 'Modifier une publication' : 'Créer une publication'}</h2><form onSubmit={submit}>
      <div className="form-row"><div className="form-field"><label htmlFor="kind">Type de contenu</label><select id="kind" value={draft.kind} onChange={e => update('kind', e.target.value as EntryKind)}><option value="ressource">Livret / Support pédagogique</option><option value="article">Article / Conseil</option></select></div><div className="form-field"><label htmlFor="category">Catégorie</label><select id="category" value={draft.category} onChange={e => update('category', e.target.value)}>{categories.map(item => <option key={item} value={item}>{item}</option>)}</select></div></div>
      <div className="form-field"><label htmlFor="title">Titre *</label><input id="title" required maxLength={170} value={draft.title} onChange={e => { const value = e.target.value; setDraft(d => ({ ...d, title: value, slug: editingId || (d.slug && d.slug !== slugify(d.title)) ? d.slug : slugify(value) })); }} placeholder="Ex. Le sommeil de bébé"/></div>
      <div className="form-field"><label htmlFor="slug">Adresse de la publication *</label><input id="slug" required value={draft.slug} onChange={e => update('slug', e.target.value)} placeholder="le-sommeil-de-bebe"/><small>Cette adresse doit être unique pour chaque création et article.</small></div>
      <div className="form-field"><label htmlFor="excerpt">Petite description *</label><textarea id="excerpt" required maxLength={600} rows={3} style={{ minHeight: 87 }} value={draft.excerpt} onChange={e => update('excerpt', e.target.value)} placeholder="De quoi parle cette publication ?"/></div>
      {draft.kind === 'article' && <div className="form-field"><label htmlFor="body">Texte de l’article *</label><textarea id="body" required value={draft.body} onChange={e => update('body', e.target.value)} rows={11} placeholder="Rédiger le contenu ici…"/><small>Pour cette première version : texte simple, avec retours à la ligne conservés.</small></div>}
      {draft.kind === 'ressource' && <><div className="form-row"><div className="form-field"><label htmlFor="support-type">Type de création</label><select id="support-type" value={draft.support_type} onChange={e => update('support_type', e.target.value as Draft['support_type'])}><option value="livret">Livret</option><option value="fiche">Fiche pratique</option><option value="kit">Kit & activité</option><option value="guide">Guide</option></select></div><div className="form-field"><label htmlFor="audience">Public / âge conseillé</label><input id="audience" maxLength={90} value={draft.audience} onChange={e => update('audience',e.target.value)} placeholder="Ex. Futurs parents, 0–6 mois, 2–4 ans" /></div></div><div className="form-row"><div className="form-field"><label htmlFor="pages">Nombre de pages (facultatif)</label><input id="pages" type="number" min="1" max="10000" value={draft.page_count ?? ''} onChange={e => update('page_count', e.target.value ? Number(e.target.value) : null)} /></div><label className="form-toggle"><input type="checkbox" checked={draft.is_featured} onChange={e => update('is_featured',e.target.checked)} /> Mettre à la une sur l’accueil</label></div><div className="form-field"><label htmlFor="body-support">Présentation détaillée du support</label><textarea id="body-support" rows={7} value={draft.body} onChange={e => update('body', e.target.value)} placeholder="Contenu du livret, objectifs pédagogiques, conseils d’utilisation…" /></div></>}<div className="form-field"><label htmlFor="cover">Image de couverture (facultatif)</label><input key={`cover-${fileKey}`} id="cover" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseCover}/><small>JPG, PNG ou WebP · maximum 6 Mo</small>{draft.cover_path && <div className="file-hint">Une image est déjà présente. Un nouvel envoi la remplacera.</div>}</div>
      <div className="form-field"><label htmlFor="attachment">{draft.kind === 'ressource' ? 'Document disponible en téléchargement (facultatif)' : 'Pièce jointe (facultatif)'}</label><input key={`attachment-${fileKey}`} id="attachment" type="file" accept=".pdf,.docx,.xlsx,.pptx,.jpg,.jpeg,.png,.webp" onChange={chooseAttachment}/><small>PDF, Word, Excel, PowerPoint ou image · maximum 15 Mo. Attention : si un fichier est joint à une création publiée, il sera accessible gratuitement et publiquement.</small>{draft.attachment_name && <div className="file-hint">Fichier actuel : {draft.attachment_name}</div>}</div>
      {draft.kind === 'ressource' && <fieldset className="commerce-admin-panel"><legend>Formats proposés à la vente</legend><label className="form-toggle"><input type="checkbox" checked={draft.pdf_for_sale} onChange={e=>update('pdf_for_sale',e.target.checked)}/> Vendre la version PDF numérique</label>{draft.pdf_for_sale && <><div className="form-field"><label>Prix du PDF (€ TTC)</label><input type="number" step="0.01" min="0.50" value={draft.pdf_price_cents===null?'':(draft.pdf_price_cents/100).toFixed(2)} onChange={e=>update('pdf_price_cents',e.target.value?Math.round(Number(e.target.value)*100):null)}/></div><div className="form-field"><label>PDF payant (stockage PRIVÉ)</label><input key={`paid-${fileKey}`} type="file" accept="application/pdf,.pdf" onChange={choosePaidPdf}/><small>PDF uniquement · 50 Mo max. {draft.paid_pdf_name?`Fichier privé actuel : ${draft.paid_pdf_name}`:'Aucun fichier payant encore déposé.'}</small></div></>}
    <label className="form-toggle"><input type="checkbox" checked={draft.print_for_sale} onChange={e=>update('print_for_sale',e.target.checked)}/> Vendre le livret physique imprimé</label>{draft.print_for_sale && <div className="form-field"><label>Prix du livret imprimé (€ TTC, hors livraison)</label><input type="number" step="0.01" min="0.50" value={draft.print_price_cents===null?'':(draft.print_price_cents/100).toFixed(2)} onChange={e=>update('print_price_cents',e.target.value?Math.round(Number(e.target.value)*100):null)}/><small>Les frais de port sont configurés dans Vercel par SHIPPING_FEE_CENTS.</small></div>}
    <div className="form-field"><label>Stock de livrets imprimés (vide = illimité, 0 = rupture)</label><input type="number" min="0" value={draft.print_stock??''} onChange={e=>update('print_stock',e.target.value===''?null:Number(e.target.value))}/></div><label className="form-toggle"><input type="checkbox" checked={draft.is_hidden} onChange={e=>update('is_hidden',e.target.checked)}/> Masquer cette création du site et bloquer sa vente</label>
    <p className="admin-note">Le document joint public juste au-dessus reste gratuit et accessible à tous. Ne jamais y envoyer un PDF destiné à la vente. Les anciens fichiers publics ne deviennent pas privés automatiquement.</p></fieldset>}
    <label className="form-toggle"><input type="checkbox" checked={draft.published} onChange={e => update('published', e.target.checked)}/> Publier immédiatement sur le site</label>
      <div className="admin-actions"><button className="btn btn-primary" type="submit" disabled={busy}><Save size={16}/>{busy ? 'Enregistrement…' : editingId ? 'Enregistrer les modifications' : 'Créer la publication'}</button><button className="btn btn-outline" type="button" onClick={resetForm} disabled={busy}><RotateCcw size={16}/> Réinitialiser</button></div>
    </form></div></div><p className="admin-note" style={{ marginTop: 24 }}>Le fichier joint public reste téléchargeable gratuitement. Utilisez le champ PDF privé dans « Formats proposés à la vente » pour un document payant. Conservez les fichiers privés déjà vendus pour les anciennes commandes.</p>
  </div></section>;
}

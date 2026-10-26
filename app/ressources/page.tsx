import type { Metadata } from 'next';
import { Download, FileText, Heart } from 'lucide-react';
import { getPublished, publicFileUrl } from '@/lib/data';
export const metadata: Metadata = { title: 'Ressources à télécharger', description: 'Guides, check-lists et fiches pratiques à télécharger gratuitement.' };
export const dynamic = 'force-dynamic';
export default async function ResourcesPage() {
  const resources = await getPublished('ressource');
  return <><div className="page-hero"><div className="container"><p className="eyebrow">UNE BIBLIOTHÈQUE PENSÉE POUR VOUS</p><h1>Des ressources <em>tout en douceur</em></h1><p>Des petites aides à conserver et à retrouver quand vous en avez besoin. Guides, PDF, fiches et documents utiles à télécharger.</p></div></div><section className="section content-section"><div className="container">{resources.length ? <div className="resource-grid">{resources.map(entry => <div className="resource-item" key={entry.id}><div className="resource-icon"><FileText size={32} strokeWidth={1.3}/></div><div><span className="eyebrow">{entry.category}</span><h2>{entry.title}</h2><p>{entry.excerpt}</p>{entry.attachment_path ? <a href={publicFileUrl(entry.attachment_path) ?? '#'} target="_blank" rel="noopener noreferrer" className="underlined-link" download={entry.attachment_name ?? undefined}>Télécharger {entry.attachment_name ? `· ${entry.attachment_name}` : 'le document'} <Download size={14}/></a> : <span className="eyebrow">Document bientôt disponible</span>}</div></div>)}</div> : <div className="empty-content"><Heart size={32} strokeWidth={1.3}/><h3>Une bibliothèque en préparation</h3><p>Les documents à télécharger feront bientôt leur apparition ici.</p></div>}</div></section></>;
}

import type { Metadata } from 'next';
import { BookOpen, ArrowRight } from 'lucide-react';
import { EntryCard } from '@/components/entry-card';
import { getPublished } from '@/lib/data';
export const metadata: Metadata = { title: 'Les articles', description: 'Des conseils bienveillants autour de la grossesse, de la naissance et de la petite enfance.' };
export const dynamic = 'force-dynamic';
export default async function ArticlesPage() {
  const articles = await getPublished('article');
  return <><div className="page-hero"><div className="container"><p className="eyebrow">À LIRE À VOTRE RYTHME</p><h1>Les petits mots <em>du quotidien</em></h1><p>Des articles pour comprendre, découvrir et se rassurer, tout au long de cette jolie aventure.</p></div></div>
  <div className="section content-section"><div className="container">{articles.length ? <div className="entry-grid">{articles.map(entry => <EntryCard entry={entry} key={entry.id}/>)}</div> : <div className="empty-content"><BookOpen size={32} strokeWidth={1.3}/><h3>Les articles arrivent bientôt</h3><p>En attendant, les premiers conseils sont déjà sur Instagram.</p><a className="soft-link" href="https://www.instagram.com/mamantoutendouceur/" target="_blank" rel="noopener noreferrer">Voir le compte Instagram <ArrowRight size={16}/></a></div>}</div></div></>;
}

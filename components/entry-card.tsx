import Link from 'next/link';
import { ArrowUpRight, FileText } from 'lucide-react';
import { type Entry, prettyDate, publicFileUrl } from '@/lib/data';

export function EntryCard({ entry }: { entry: Entry }) {
  const cover = publicFileUrl(entry.cover_path);
  const href = entry.kind === 'article' ? `/articles/${entry.slug}` : '/ressources';
  return <article className="entry-card">
    <Link href={href} aria-label={`Découvrir ${entry.title}`} className="entry-visual">
      {cover ? <img src={cover} alt="" loading="lazy"/> : <div className="entry-fallback"><span className="small-flower">✿</span>{entry.kind === 'ressource' ? <FileText size={34} strokeWidth={1.3}/> : <span className="fallback-caption">Maman tout en douceur</span>}</div>}
    </Link>
    <div className="entry-detail"><span className="eyebrow">{entry.category} <span className="dot">•</span> {prettyDate(entry.created_at)}</span>
      <h3><Link href={href}>{entry.title}</Link></h3><p>{entry.excerpt}</p><Link className="underlined-link" href={href}>{entry.kind === 'article' ? 'Lire l’article' : 'Découvrir le document'} <ArrowUpRight size={16}/></Link>
    </div>
  </article>;
}

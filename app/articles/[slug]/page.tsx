import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';
import { getArticle, prettyDate, publicFileUrl } from '@/lib/data';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticle((await params).slug);
  return article ? { title: article.title, description: article.excerpt } : { title: 'Article introuvable' };
}
export default async function ArticlePage({ params }: Props) {
  const article = await getArticle((await params).slug);
  if (!article) notFound();
  const cover = publicFileUrl(article.cover_path);
  return <article className="article-shell"><Link className="back-link" href="/articles"><ArrowLeft size={14} style={{ verticalAlign: 'middle' }}/> Tous les articles</Link><div className="article-heading"><p className="eyebrow">{article.category} · {prettyDate(article.created_at)}</p><h1>{article.title}</h1><p className="article-excerpt">{article.excerpt}</p></div>{cover && <img className="article-cover" src={cover} alt={`Illustration de ${article.title}`}/>}<div className="article-body">{article.body}</div>{article.attachment_path && <a className="btn btn-outline" href={publicFileUrl(article.attachment_path) ?? '#'} target="_blank" rel="noopener noreferrer" style={{ marginTop: 35 }}><Download size={17}/> Télécharger {article.attachment_name || 'le document joint'}</a>}</article>;
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, BookOpen, Download, FileText, Heart, Leaf } from 'lucide-react';
import { getResource, publicFileUrl, supportTypeLabel } from '@/lib/data';
import { PurchaseOptions } from '@/components/purchase-options';
import { ProductReviews } from '@/components/product-reviews';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };
const getSupport = getResource;
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params;const item=await getSupport(slug); return item ? {title:item.title,description:item.excerpt} : {title:'Support introuvable'};}
export default async function ResourceDetailPage({params}:Props){
  const {slug}=await params; const entry=await getSupport(slug); if(!entry) notFound();
  const cover=publicFileUrl(entry.cover_path); const file=publicFileUrl(entry.attachment_path);
  return <div className="shop-detail-page"><div className="container"><Link href="/ressources" className="shop-back-link"><ArrowLeft size={16}/> Revenir à la collection</Link>
    <div className="shop-detail-grid"><div className="shop-detail-art"><div className="shop-detail-image">{cover ? <img src={cover} alt={`Couverture : ${entry.title}`} /> : <div className="shop-detail-placeholder"><div className="shop-detail-book"><span>MAMAN TOUT EN DOUCEUR</span><i>✿</i><strong>{entry.title}</strong><small>une création pleine de douceur</small></div></div>}</div><p className="shop-detail-image-caption"><Heart size={15}/> Une création imaginée avec soin.</p></div>
    <div className="shop-detail-copy"><p className="shop-kicker">{supportTypeLabel(entry.support_type).toUpperCase()} · {entry.category.toUpperCase()}</p><h1>{entry.title}</h1><p className="shop-detail-excerpt">{entry.excerpt}</p><div className="shop-detail-specs"><div><Leaf size={18}/><div><span>Thématique</span><strong>{entry.category}</strong></div></div>{entry.audience && <div><Heart size={18}/><div><span>Pour qui ?</span><strong>{entry.audience}</strong></div></div>}{entry.page_count ? <div><BookOpen size={18}/><div><span>Contenu</span><strong>{entry.page_count} pages</strong></div></div>:null}<div><FileText size={18}/><div><span>Format</span><strong>{file ? (entry.attachment_name?.split('.').pop()?.toUpperCase() || 'Document') : 'À venir'}</strong></div></div></div>
      {entry.body.trim() && <div className="shop-detail-description"><h2>À l’intérieur de ce support</h2><p>{entry.body}</p></div>}
      <PurchaseOptions entry={entry}/><div className="shop-detail-action"><p>À retrouver et à utiliser à votre rythme.</p>{file ? <a className="btn btn-outline" href={file} target="_blank" rel="noopener noreferrer">Télécharger le document gratuit <Download size={17}/></a> : <span className="shop-soon-pill">Ce support sera bientôt disponible</span>}{file && <small>Ce document est gratuit et public. Les versions payantes sont proposées séparément ci-dessus.</small>}</div>
    </div></div><ProductReviews entryId={entry.id}/><div className="shop-detail-end"><span>✿</span><p>Les petits pas font aussi les grands chemins.</p><Link href="/ressources">Découvrir d’autres supports <ArrowUpRight size={16}/></Link></div></div></div>;
}

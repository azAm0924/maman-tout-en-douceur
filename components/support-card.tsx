import Link from 'next/link';
import { ArrowUpRight, FileText } from 'lucide-react';
import { type Entry, publicFileUrl, supportTypeLabel, euro } from '@/lib/data';

export function SupportCard({ entry }: { entry: Entry }) {
  const cover = publicFileUrl(entry.cover_path);
  return <article className="shop-product-card">
    <Link href={`/ressources/${entry.slug}`} className="shop-product-image" aria-label={`Découvrir ${entry.title}`}>
      <span className="shop-product-chip">{supportTypeLabel(entry.support_type)}</span>
      {cover ? <img src={cover} alt={`Couverture : ${entry.title}`} loading="lazy"/> : <div className="shop-product-placeholder"><div className="shop-product-placeholder-book"><span>MAMAN TOUT EN DOUCEUR</span><i>✿</i><strong>{entry.title}</strong><small>un support tout en douceur</small></div></div>}
    </Link>
    <div className="shop-product-info"><div className="shop-product-meta"><span>{entry.category}</span>{entry.audience && <><i>·</i><span>{entry.audience}</span></>}</div>
      {(entry.pdf_for_sale || entry.print_for_sale) && <div className="commerce-card-prices">{entry.pdf_for_sale && entry.pdf_price_cents ? <span>PDF {euro(entry.pdf_price_cents)}</span> : null}{entry.print_for_sale && entry.print_price_cents ? <span>Imprimé {euro(entry.print_price_cents)}</span> : null}</div>}<h3><Link href={`/ressources/${entry.slug}`}>{entry.title}</Link></h3><p>{entry.excerpt}</p><Link href={`/ressources/${entry.slug}`} className="shop-product-action">Découvrir ce support <ArrowUpRight size={17}/></Link>
    </div>
  </article>;
}

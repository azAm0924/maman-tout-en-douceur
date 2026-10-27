'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Download, ShoppingBag, BookOpen } from 'lucide-react';
import { addCart } from '@/lib/cart';
import { euro, type Entry } from '@/lib/data';
export function PurchaseOptions({entry}:{entry:Entry}){
  const [justAdded,setJustAdded]=useState('');
  const variants=[
    ...(entry.pdf_for_sale && entry.pdf_price_cents && entry.paid_pdf_path ? [{variant:'pdf' as const,title:'Version PDF',price:entry.pdf_price_cents,icon:Download,detail:'À télécharger après paiement'}] : []),
    ...(entry.print_for_sale && entry.print_price_cents ? [{variant:'print' as const,title:'Livret imprimé',price:entry.print_price_cents,icon:BookOpen,detail:'Expédié en France (+ frais de port)'}] : []),
  ];
  if(!variants.length)return null;
  return <div className="commerce-variants"><h2>Choisissez votre format</h2>{variants.map(item=><div className="commerce-variant" key={item.variant}><item.icon size={21}/><div><strong>{item.title}</strong><small>{item.detail}</small></div><span>{euro(item.price)}</span><button type="button" className="btn btn-primary" onClick={()=>{addCart({entryId:entry.id,title:entry.title,slug:entry.slug,variant:item.variant,quantity:1,priceCents:item.price});setJustAdded(item.variant);}}><ShoppingBag size={16}/> Ajouter</button></div>)}{justAdded && <p role="status" className="commerce-success">Ajouté au panier. <Link href="/panier">Voir mon panier →</Link></p>}</div>;
}

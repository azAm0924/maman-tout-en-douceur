import type { Metadata } from 'next';
import { Catalogue } from '@/components/catalogue';
import { getPublished } from '@/lib/data';
export const metadata: Metadata = { title: 'La collection de livrets & supports pédagogiques', description: 'Découvrez les livrets, fiches et supports pédagogiques de Maman tout en douceur, pour les parents et les tout-petits.' };
export const dynamic = 'force-dynamic';
export default async function RessourcesPage() {
  const resources = await getPublished('ressource');
  return <><section className="shop-page-hero"><div className="container"><p className="shop-kicker">LES CRÉATIONS DE MAMAN TOUT EN DOUCEUR</p><h1>La petite <em>collection.</em></h1><p>Des livrets, des fiches et des outils pensés pour vous accompagner avec douceur. Prenez le temps de trouver celui qui vous ressemble.</p><div className="shop-page-doodle" aria-hidden="true">✿</div></div></section>
  <section className="shop-catalogue-section"><div className="container"><Catalogue resources={resources}/></div></section></>;
}

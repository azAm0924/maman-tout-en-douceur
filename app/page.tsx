import Link from 'next/link';
import { ArrowRight, BookHeart, BookOpen, Check, Flower2, Heart, Leaf, MoveUpRight, Sparkles } from 'lucide-react';
import { getPublished } from '@/lib/data';
import { SupportCard } from '@/components/support-card';

export const dynamic = 'force-dynamic';

const collections = [
  { number: '01', name: 'Les livrets', tagline: 'Des petites pages à feuilleter et à garder près de soi.', kind: 'livret', icon: BookOpen, color: 'peach' },
  { number: '02', name: 'Les fiches pratiques', tagline: 'Des repères simples pour accompagner le quotidien.', kind: 'fiche', icon: Leaf, color: 'sage' },
  { number: '03', name: 'Les kits & activités', tagline: 'Des supports pour découvrir, comprendre et grandir.', kind: 'kit', icon: Sparkles, color: 'rose' },
];

export default async function HomePage() {
  const resources = await getPublished('ressource');
  const featured = [...resources].sort((a,b) => Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured))).slice(0,3);
  return <>
    <section className="shop-hero" aria-labelledby="shop-home-title">
      <div className="container shop-hero-grid">
        <div className="shop-hero-content">
          <p className="shop-kicker shop-enter shop-enter-1"><span className="shop-kicker-line" /> UN UNIVERS CRÉÉ AVEC TENDRESSE</p>
          <h1 className="shop-enter shop-enter-2" id="shop-home-title">Des petits outils pour de <em>grandes découvertes.</em></h1>
          <p className="shop-hero-lead shop-enter shop-enter-3">Livrets, fiches et supports pédagogiques pensés pour accompagner les (futurs) parents et les tout-petits, avec simplicité et douceur.</p>
          <div className="shop-hero-actions shop-enter shop-enter-4">
            <Link className="btn btn-primary" href="/ressources">Découvrir les créations <ArrowRight size={17} /></Link>
            <Link className="shop-text-link" href="/a-propos">L’histoire du projet <MoveUpRight size={16} /></Link>
          </div>
          <div className="shop-hero-annotation shop-enter shop-enter-5"><Heart size={15} /> Fait avec soin, à votre rythme.</div>
        </div>
        <div className="shop-hero-display" aria-label="Présentation illustrée des livrets et supports pédagogiques">
          <div className="shop-hero-oval" />
          <div className="shop-hero-book shop-hero-book-back" aria-hidden="true"><span>mes petites notes</span><i>✽</i></div>
          <div className="shop-hero-book shop-hero-book-front" aria-hidden="true"><span className="shop-book-brand">MAMAN TOUT EN DOUCEUR</span><span className="shop-book-flower">✿</span><span className="shop-book-title">Petits pas,<br /><em>grandes découvertes</em></span><span className="shop-book-rule" /><span className="shop-book-footer">livrets & supports pédagogiques</span></div>
          <div className="shop-hero-note" aria-hidden="true">Grandir & apprendre <em>tout doucement</em> ♡</div>
          <div className="shop-hero-blossom" aria-hidden="true">✳</div>
        </div>
      </div>
      <div className="shop-hero-bottom" aria-hidden="true"><span>IMAGINÉ AVEC LE CŒUR</span><span>✿</span><span>FAIT POUR LES PETITES DÉCOUVERTES</span></div>
    </section>

    <section className="shop-intro-strip" aria-label="Notre philosophie"><div className="container shop-intro-strip-inner"><span><Flower2 size={19} /> Avec bienveillance</span><b>✧</b><span><Heart size={19} /> À votre rythme</span><b>✧</b><span><BookHeart size={19} /> Pour apprendre autrement</span></div></section>

    <section className="shop-section shop-collections" id="collections"><div className="container">
      <div className="shop-section-head" data-reveal><div><p className="shop-kicker">UNE COLLECTION QUI GRANDIT</p><h2>À chaque besoin, <em>son petit support.</em></h2></div><p>Des créations disponibles en PDF, imprimées ou dans les deux formats selon le support.</p></div>
      <div className="shop-collections-grid">
        {collections.map((collection,index) => { const Icon = collection.icon; return <Link data-reveal href={`/ressources?type=${collection.kind}`} className={`shop-collection shop-collection-${collection.color} reveal-delay-${index+1}`} key={collection.kind}>
          <div className="shop-collection-top"><span>{collection.number} / 03</span><Icon size={27} strokeWidth={1.35}/></div>
          <div className="shop-collection-art" aria-hidden="true"><span className="shop-collection-orbit"/><span className="shop-collection-mini-cover"><i>✿</i><span>{collection.kind === 'livret' ? 'Mon petit livret' : collection.kind === 'fiche' ? 'Ma jolie fiche' : 'On découvre'}</span></span></div>
          <div className="shop-collection-bottom"><h3>{collection.name}</h3><p>{collection.tagline}</p><span className="shop-collection-arrow"><ArrowRight size={20} /></span></div>
        </Link>; })}
      </div>
    </div></section>

    <section className="shop-section shop-featured"><div className="container">
      <div className="shop-section-head shop-featured-head" data-reveal><div><p className="shop-kicker">LA PETITE BIBLIOTHÈQUE</p><h2>Nos créations <em>à découvrir.</em></h2></div><Link className="shop-text-link" href="/ressources">Toute la collection <ArrowRight size={17}/></Link></div>
      {featured.length ? <div className="shop-product-grid">{featured.map((item,index)=><div data-reveal className={`reveal-delay-${index+1}`} key={item.id}><SupportCard entry={item}/></div>)}</div> : <div className="shop-coming-soon" data-reveal><div className="shop-soon-art"><span>✿</span></div><div><p className="shop-kicker">EN PRÉPARATION</p><h3>Les premières créations prennent forme…</h3><p>Les livrets et supports seront bientôt réunis ici. Chaque petite chose se construit avec patience.</p><Link className="shop-text-link" href="/ressources">Découvrir la bibliothèque <ArrowRight size={16}/></Link></div></div>}
    </div></section>

    <section className="shop-story"><div className="container shop-story-grid">
      <div className="shop-story-art" data-reveal aria-hidden="true"><span className="shop-story-halo"/><div className="shop-story-paper"><span className="shop-story-flower">✿</span><span>Créer,<br /><em>transmettre,</em><br/>accompagner.</span><small>tout en douceur ♡</small></div><span className="shop-story-spark">✳</span></div>
      <div className="shop-story-copy" data-reveal><p className="shop-kicker">UN MOT SUR MOI</p><h2>Des ressources pensées <em>avec le cœur.</em></h2><p>Auxiliaire de puériculture et passionnée par la petite enfance, j’imagine un espace où les parents trouvent des idées, des repères et des supports à utiliser au quotidien.</p><p>Sans pression, sans perfection : juste des outils accessibles pour avancer à son propre rythme.</p><ul><li><Check size={17}/> Des contenus clairs et faciles à utiliser</li><li><Check size={17}/> Une approche douce et bienveillante</li><li><Check size={17}/> Des supports pensés pour le quotidien</li></ul><Link href="/a-propos" className="btn btn-outline">En savoir plus sur moi <ArrowRight size={17}/></Link></div>
    </div></section>

    <section className="shop-section shop-how"><div className="container"><div className="shop-section-head shop-center" data-reveal><div><p className="shop-kicker">TOUT SIMPLEMENT</p><h2>Comment ça <em>fonctionne ?</em></h2></div><p>Quelques gestes simples pour retrouver les ressources qui vous correspondent.</p></div><div className="shop-how-grid">{[
      {n:'01',title:'Je découvre',desc:'Je parcours les livrets et supports selon mes besoins.'},
      {n:'02',title:'Je choisis mon format',desc:'Selon le support : PDF numérique ou livret imprimé.'},
      {n:'03',title:'Je reçois',desc:'PDF à télécharger après paiement ou livret livré chez moi.'},
    ].map((step,i)=><div className={`shop-how-step reveal-delay-${i+1}`} data-reveal key={step.n}><span>{step.n}</span><h3>{step.title}</h3><p>{step.desc}</p></div>)}</div></div></section>

    <section className="shop-newsletter" aria-labelledby="shop-instagram-title"><div className="container shop-newsletter-content" data-reveal><span className="shop-newsletter-icon">✿</span><p className="shop-kicker">ON SE RETROUVE LÀ-BAS ?</p><h2 id="shop-instagram-title">Encore un peu de <em>douceur</em> au quotidien.</h2><p>Des partages autour de la maternité et de la petite enfance sur Instagram.</p><a className="btn btn-primary" href="https://www.instagram.com/mamantoutendouceur/" target="_blank" rel="noopener noreferrer">Retrouvez-moi sur Instagram <ArrowRight size={17}/></a></div></section>
  </>;
}

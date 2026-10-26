import Link from 'next/link';
import {
  ArrowDown,
  ArrowRight,
  Baby,
  BookOpen,
  Download,
  Flower2,
  Heart,
  HeartHandshake,
  Instagram,
  Leaf,
  Sparkles,
} from 'lucide-react';
import { EntryCard } from '@/components/entry-card';
import { getPublished } from '@/lib/data';

export const dynamic = 'force-dynamic';

const topics = [
  {
    label: 'La grossesse',
    intro: 'Neuf mois de changements, de questions et de découvertes.',
    symbol: '01',
    icon: Flower2,
    className: 'topic-rose',
  },
  {
    label: 'La naissance',
    intro: 'Se préparer à la rencontre, sans pression.',
    symbol: '02',
    icon: Heart,
    className: 'topic-beige',
  },
  {
    label: 'Le post-partum',
    intro: 'Prendre soin de bébé, mais aussi de vous.',
    symbol: '03',
    icon: Leaf,
    className: 'topic-green',
  },
  {
    label: 'Les premiers mois',
    intro: 'Apprendre à se connaître, un jour après l’autre.',
    symbol: '04',
    icon: Baby,
    className: 'topic-check',
  },
];

export default async function HomePage() {
  const articles = await getPublished('article', 3);

  return (
    <>
      <section className="hero landing-hero" aria-labelledby="landing-title">
        <div className="container hero-layout landing-hero-layout">
          <div className="hero-copy">
            <p className="eyebrow hero-eyebrow hero-enter enter-one">
              <span className="eyebrow-rule" aria-hidden="true" />
              UN COCON POUR LES (FUTURS) PARENTS
            </p>
            <h1 id="landing-title" className="hero-enter enter-two">
              Chaque étape mérite
              <br />
              <em>sa douceur.</em>
            </h1>
            <p className="hero-subtitle hero-enter enter-three">
              Grossesse, naissance, premiers instants avec bébé… Des mots qui rassurent,
              des conseils accessibles et la liberté d’avancer à votre rythme.
            </p>
            <div className="hero-actions hero-enter enter-four">
              <Link href="/articles" className="btn btn-primary">
                Découvrir les conseils <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link href="/a-propos" className="soft-link">
                Mon univers <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="hero-assurance hero-enter enter-five">
              <span className="hero-assurance-icon"><Heart size={16} aria-hidden="true" /></span>
              <span>Ici, chaque histoire a sa place.</span>
            </div>
          </div>

          <div className="hero-art landing-hero-art" aria-label="Illustration florale aux couleurs poudrées" id='illuFlo'>
            <div className="hero-visual">
              <span className="hero-circle one" aria-hidden="true" />
              <span className="hero-circle two" aria-hidden="true" />
              <span className="hero-orbit" aria-hidden="true" />
              <img
                className="flower-art"
                src="/ornament.svg"
                alt="Une fleur délicate entourée de feuilles pastel"
                width="340"
                height="385"
                fetchPriority="high"
              />
              <div className="circle-stamp" aria-hidden="true">
                tout en <span>✿</span> douceur
              </div>
              <span className="visual-edge">maternité · bébé · bienveillance</span>
            </div>
            <div className="small-badge" aria-hidden="true">
              <span>✧</span> À votre rythme, toujours.
            </div>
            <span className="hero-sparkle sparkle-one" aria-hidden="true">✳</span>
            <span className="hero-sparkle sparkle-two" aria-hidden="true">✧</span>
          </div>
        </div>
        <a className="landing-scroll" href="#decouvrir" aria-label="Faire défiler pour découvrir le site">
          <span>PRENDRE LE TEMPS DE DÉCOUVRIR</span>
          <ArrowDown size={16} aria-hidden="true" />
        </a>
      </section>

      <div className="comfort-bar" aria-label="Les valeurs du site">
        <div className="container comfort-bar-inner">
          <span><HeartHandshake size={19} aria-hidden="true" /> Sans jugement</span>
          <i aria-hidden="true">✿</i>
          <span><Sparkles size={19} aria-hidden="true" /> Des conseils tout doux</span>
          <i aria-hidden="true">✿</i>
          <span><Leaf size={19} aria-hidden="true" /> À votre rythme</span>
        </div>
      </div>

      <section id="decouvrir" className="section topics-section" aria-labelledby="topics-title">
        <div className="container">
          <div className="section-heading centered" data-reveal>
            <p className="eyebrow">UN PEU DE DOUCEUR À CHAQUE ÉTAPE</p>
            <h2 id="topics-title">Un chemin, <em>mille petits moments.</em></h2>
            <p>
              Quelle que soit l’étape que vous traversez, vous trouverez ici des repères
              simples pour avancer avec davantage de confiance.
            </p>
          </div>
          <div className="topic-grid">
            {topics.map((topic, index) => {
              const TopicIcon = topic.icon;
              return (
                <Link
                  key={topic.symbol}
                  className={`topic-card ${topic.className} reveal-delay-${index + 1}`}
                  href="/articles"
                  data-reveal
                >
                  <div className="topic-top">
                    <span>{topic.symbol} / 04</span>
                    <TopicIcon size={26} strokeWidth={1.3} aria-hidden="true" />
                  </div>
                  <div className="topic-flower" aria-hidden="true">✿</div>
                  <div className="topic-bottom">
                    <h3>{topic.label}</h3>
                    <p>{topic.intro}</p>
                    <span className="topic-arrow"><ArrowRight size={19} aria-hidden="true" /></span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section introduction" aria-labelledby="introduction-title">
        <div className="container introduction-grid">
          <div className="intro-art" data-reveal>
            <div className="intro-art-frame">
              <div className="decorated-note">
                <span className="script">Douceur</span>
                <span>petits pas & grands bonheurs</span>
                <span className="note-flower" aria-hidden="true">✿</span>
              </div>
            </div>
            <span className="small-circle-word">prendre soin<br />de vous aussi ♡</span>
          </div>
          <div className="intro-content" data-reveal>
            <p className="eyebrow">DERRIÈRE MAMAN TOUT EN DOUCEUR</p>
            <h2 id="introduction-title">Un petit coin où l’on se sent <em>compris.</em></h2>
            <p>
              Auxiliaire de puériculture et passionnée par l’univers de la petite enfance,
              je partage ici des informations accessibles, des conseils pratiques et des
              ressources pensées pour les parents.
            </p>
            <p>
              Mon souhait : vous accompagner avec bienveillance, en vous laissant la place
              de faire confiance à votre instinct.
            </p>
            <Link href="/a-propos" className="btn btn-outline">
              Faisons connaissance <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <div className="landing-quote" aria-label="Une pensée douce" data-reveal>
        <span className="quote-flower" aria-hidden="true">✿</span>
        <p>Il n’y a pas qu’une façon de devenir parent.<br /><em>Il y a la vôtre.</em></p>
        <span className="quote-mark" aria-hidden="true">♡</span>
      </div>

      <section className="section articles-section" aria-labelledby="articles-title">
        <div className="container">
          <div className="section-heading split-heading" data-reveal>
            <div>
              <p className="eyebrow">À FEUILLETER AVEC UN THÉ</p>
              <h2 id="articles-title">Les derniers <em>articles</em></h2>
            </div>
            <Link href="/articles" className="soft-link">
              Tous les articles <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
          {articles.length ? (
            <div className="entry-grid">
              {articles.map((entry, index) => (
                <div key={entry.id} className={`reveal-delay-${index + 1}`} data-reveal>
                  <EntryCard entry={entry} />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-content landing-empty" data-reveal>
              <BookOpen size={32} strokeWidth={1.2} aria-hidden="true" />
              <h3>Les premiers articles arrivent bientôt…</h3>
              <p>En attendant, retrouvons-nous sur Instagram pour des conseils au quotidien.</p>
              <a className="soft-link" href="https://www.instagram.com/mamantoutendouceur/" target="_blank" rel="noopener noreferrer">
                Découvrir Instagram <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
      </section>

      <section className="resources-banner" aria-labelledby="resources-title">
        <div className="container resources-layout">
          <div data-reveal>
            <p className="eyebrow">DES OUTILS À GARDER PRÈS DE SOI</p>
            <h2 id="resources-title">Une petite bibliothèque<br /><em>de ressources utiles.</em></h2>
            <p>
              Guides, fiches pratiques et documents PDF à retrouver facilement,
              pour vous accompagner au quotidien.
            </p>
            <Link className="btn btn-primary" href="/ressources">
              Explorer les ressources <Download size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="paper-stack" data-reveal aria-hidden="true">
            <div className="paper paper-behind" />
            <div className="paper paper-front">
              <div className="paper-flower">✿</div>
              <span>Pour toi,<br /><em>doucement</em></span>
              <small>à télécharger ♡</small>
            </div>
          </div>
        </div>
      </section>

      <section className="instagram-invite" aria-labelledby="instagram-title">
        <div className="container instagram-invite-inner" data-reveal>
          <span className="instagram-icon"><Instagram size={26} strokeWidth={1.5} aria-hidden="true" /></span>
          <p className="eyebrow">ON SE RETROUVE LÀ-BAS ?</p>
          <h2 id="instagram-title">Encore un peu de <em>douceur</em> au quotidien.</h2>
          <p>Conseils, partages et petits instants à retrouver sur Instagram.</p>
          <a
            href="https://www.instagram.com/mamantoutendouceur/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            @mamantoutendouceur <ArrowRight size={17} aria-hidden="true" />
          </a>
        </div>
      </section>
    </>
  );
}

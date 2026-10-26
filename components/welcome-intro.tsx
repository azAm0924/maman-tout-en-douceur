'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

// Temps total de l'intro (apparition + disparition) en millisecondes.
// À synchroniser avec la durée de l'animation CSS `welcomeIntroFade`.
const INTRO_DURATION_MS = 1600;
const SESSION_KEY = 'mted-welcome-intro-v1';

export function WelcomeIntro() {
  const pathname = usePathname();
  // Le composant est monté une seule fois dans le layout : on ne rejoue pas
  // l'intro lorsqu'on revient sur l'accueil avec la navigation interne.
  const [visible, setVisible] = useState(pathname === '/');
  // Empêche React StrictMode (en développement) de confondre sa deuxième
  // exécution de l'effet avec une nouvelle visite.
  const alreadySeenOnEntry = useRef<boolean | null>(null);

  useEffect(() => {
    if (pathname !== '/') return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const forcePreview = new URLSearchParams(window.location.search).get('intro') === '1';

    if (alreadySeenOnEntry.current === null) {
      let alreadySeen = false;
      try {
        alreadySeen = sessionStorage.getItem(SESSION_KEY) === '1';
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        // La navigation reste fonctionnelle si le navigateur bloque le stockage.
      }
      alreadySeenOnEntry.current = alreadySeen;
    }

    // Le script placé avant le contenu masque déjà l'intro dès le premier
    // affichage lors des visites suivantes, afin d'éviter un flash visible.
    if (reducedMotion || (alreadySeenOnEntry.current && !forcePreview)) {
      setVisible(false);
      return;
    }

    const timeout = window.setTimeout(() => setVisible(false), INTRO_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible || pathname !== '/') return null;

  return (
    <div className="welcome-intro" aria-hidden="true">
      <div className="welcome-intro-halo welcome-intro-halo-left" />
      <div className="welcome-intro-halo welcome-intro-halo-right" />
      <div className="welcome-intro-content">
        <span className="welcome-intro-topline">Bienvenue dans un cocon de douceur</span>
        <div className="welcome-intro-emblem">
          <span className="welcome-intro-emblem-ring" />
          <img src="/ornament.svg" width="102" height="116" alt="" />
          <span className="welcome-intro-mini-star welcome-intro-mini-star-one">✧</span>
          <span className="welcome-intro-mini-star welcome-intro-mini-star-two">✦</span>
        </div>
        <p className="welcome-intro-name">Maman <em>tout en douceur</em></p>
        <span className="welcome-intro-stroke" />
        <p className="welcome-intro-signature">Grandir ensemble, à votre rythme.</p>
      </div>
    </div>
  );
}

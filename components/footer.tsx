import Link from 'next/link';
import { Instagram, Heart } from 'lucide-react';
export function Footer() {
  return <footer className="site-footer"><div className="container footer-layout">
    <div><p className="footer-brand">Maman tout en douceur <span>✿</span></p><p>Livrets et supports pédagogiques conçus avec tendresse pour les parents et les tout-petits.</p></div>
    <div className="footer-links"><Link href="/ressources">Les créations</Link><Link href="/articles">Conseils</Link><Link href="/a-propos">À propos</Link><Link href="/compte">Mon compte</Link><Link href="/connexion">Connexion</Link><Link href="/panier">Mon panier</Link><Link href="/cgv">CGV</Link><Link href="/retractation">Exercer ma rétractation</Link><Link href="/confidentialite">Confidentialité</Link><Link href="/mentions-legales">Mentions légales</Link></div>
    <div><a className="footer-insta" href="https://www.instagram.com/mamantoutendouceur/" target="_blank" rel="noopener noreferrer"><Instagram size={18}/> Retrouvez-moi sur Instagram</a><p className="disclaimer">Les informations partagées ici ne remplacent pas un avis médical personnalisé.</p></div>
  </div><div className="container footer-bottom">© {new Date().getFullYear()} Maman tout en douceur <Heart size={13} fill="currentColor" aria-hidden="true"/></div></footer>;
}

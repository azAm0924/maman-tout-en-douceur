import Link from 'next/link';
import { Instagram, Heart } from 'lucide-react';
export function Footer() {
  return <footer className="site-footer"><div className="container footer-layout">
    <div><p className="footer-brand">Maman tout en douceur <span>✿</span></p><p>Des mots rassurants, des ressources utiles et un peu de douceur pour chaque étape de la maternité.</p></div>
    <div className="footer-links"><Link href="/articles">Articles</Link><Link href="/ressources">Ressources</Link><Link href="/a-propos">À propos</Link><Link href="/connexion">Connexion / administration</Link></div>
    <div><a className="footer-insta" href="https://www.instagram.com/mamantoutendouceur/" target="_blank" rel="noopener noreferrer"><Instagram size={18}/> Retrouvez-moi sur Instagram</a><p className="disclaimer">Les informations partagées ici ne remplacent pas un avis médical personnalisé.</p></div>
  </div><div className="container footer-bottom">© {new Date().getFullYear()} Maman tout en douceur <Heart size={13} fill="currentColor" aria-hidden="true"/></div></footer>;
}

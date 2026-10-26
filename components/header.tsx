'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Instagram, Menu, X } from 'lucide-react';

const pages = [
  { label: 'Accueil', href: '/' },
  { label: 'Les articles', href: '/articles' },
  { label: 'Ressources', href: '/ressources' },
  { label: 'À propos', href: '/a-propos' },
];
export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return <header className="site-header"><div className="container header-row">
    <Link className="brand" href="/" onClick={() => setOpen(false)} aria-label="Maman tout en douceur, accueil">
      <span className="brand-icon" aria-hidden="true">✿</span><span>Maman <em>tout en douceur</em></span>
    </Link>
    <button className="menu-button" type="button" onClick={() => setOpen(!open)} aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={open}>{open ? <X size={23} /> : <Menu size={23} />}</button>
    <nav aria-label="Navigation principale" className={`site-nav ${open ? 'site-nav-open' : ''}`}>
      {pages.map(page => <Link key={page.href} href={page.href} className={pathname === page.href ? 'active' : ''} onClick={() => setOpen(false)}>{page.label}</Link>)}
      <a className="instagram-link" href="https://www.instagram.com/mamantoutendouceur/" target="_blank" rel="noopener noreferrer" aria-label="Instagram Maman tout en douceur"><Instagram size={18}/></a>
    </nav>
  </div></header>;
}

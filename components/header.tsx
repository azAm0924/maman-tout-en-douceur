'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Instagram, LockKeyhole, Menu, UserRound, X, ShoppingBag } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { getBrowserClient } from '@/lib/data';
import { readCart } from '@/lib/cart';

const pages = [
  { label: 'Accueil', href: '/' },
  { label: 'Les créations', href: '/ressources' },
  { label: 'Conseils', href: '/articles' },
  { label: 'À propos', href: '/a-propos' },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cartCount,setCartCount]=useState(0);
  useEffect(()=>{const update=()=>setCartCount(readCart().reduce((n,item)=>n+item.quantity,0));update();window.addEventListener('mted-cart-update',update);window.addEventListener('storage',update);return()=>{window.removeEventListener('mted-cart-update',update);window.removeEventListener('storage',update);};},[]);

  useEffect(() => {
    const db = getBrowserClient();
    if (!db) return;

    let active = true;
    let requestId = 0;

    // L'état de la session est conservé dans le navigateur par Supabase.
    // Ne jamais déconnecter l'utilisateur parce qu'une vérification a échoué.
    async function checkAccess(session: Session | null) {
      const thisRequest = ++requestId;
      if (!session) {
        if (active) setIsAdmin(false);
        return;
      }
      const { data, error } = await db!.rpc('is_admin');
      if (active && thisRequest === requestId && !error) {
        setIsAdmin(data === true);
      }
    }

    const { data: { subscription } } = db.auth.onAuthStateChange((_event, session) => {
      // Ne pas appeler une méthode Supabase directement dans ce callback.
      Promise.resolve().then(() => { if (active) void checkAccess(session); });
    });

    void db.auth.getSession().then(({ data }) => {
      if (active) void checkAccess(data.session);
    }).catch(() => { /* Conserver l'état existant si la connexion réseau échoue. */ });

    return () => { active = false; ++requestId; subscription.unsubscribe(); };
  }, []);

  const accountHref = isAdmin ? '/admin' : '/connexion';
  const accountLabel = isAdmin ? 'Mon espace' : 'Connexion';

  return <header className="site-header"><div className="container header-row">
    <Link className="brand" href="/" onClick={() => setOpen(false)} aria-label="Maman tout en douceur, accueil">
      <span className="brand-icon" aria-hidden="true">✿</span><span>Maman <em>tout en douceur</em></span>
    </Link>
    <nav aria-label="Navigation principale" className={`site-nav ${open ? 'site-nav-open' : ''}`}>
      {pages.map(page => <Link key={page.href} href={page.href} className={pathname === page.href ? 'active' : ''} onClick={() => setOpen(false)}>{page.label}</Link>)}
      <Link className="mobile-account-nav" href={accountHref} onClick={() => setOpen(false)}>
        {isAdmin ? <UserRound size={17} /> : <LockKeyhole size={17} />} {accountLabel}
      </Link>
      <a className="instagram-link" href="https://www.instagram.com/mamantoutendouceur/" target="_blank" rel="noopener noreferrer" aria-label="Instagram Maman tout en douceur"><Instagram size={18}/></a>
    </nav>
    <div className="header-tools"><Link href="/panier" className="commerce-header-cart" aria-label={`Panier, ${cartCount} article(s)`} onClick={()=>setOpen(false)}><ShoppingBag size={19}/>{cartCount>0&&<span>{cartCount}</span>}</Link>
      <Link href={accountHref} className={`header-account-link ${isAdmin ? 'header-account-admin' : ''}`} aria-label={accountLabel} title={accountLabel} onClick={() => setOpen(false)}>
        {isAdmin ? <UserRound size={17} aria-hidden="true" /> : <LockKeyhole size={16} aria-hidden="true" />}
        <span>{accountLabel}</span>
      </Link>
      <button className="menu-button" type="button" onClick={() => setOpen(!open)} aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={open}>{open ? <X size={23} /> : <Menu size={23} />}</button>
    </div>
  </div></header>;
}

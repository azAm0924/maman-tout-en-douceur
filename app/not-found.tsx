import Link from 'next/link';
export default function NotFound() { return <div className="not-found"><p className="eyebrow">PAGE INTROUVABLE</p><h1>Cette page s’est envolée...</h1><p>Elle n’existe plus ou a changé d’adresse.</p><Link href="/" className="btn btn-primary">Retour à l’accueil</Link></div>; }

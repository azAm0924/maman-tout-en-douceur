'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { getBrowserClient } from '@/lib/data';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const db = getBrowserClient();
    if (!db) { setError('Supabase n’est pas encore configuré. Consultez le README.'); return; }
    setPending(true);
    try {
      const { error: loginError } = await db.auth.signInWithPassword({ email, password });
      if (loginError) throw new Error('Identifiants incorrects ou compte non autorisé.');
      const { data: isAdmin, error: permissionError } = await db.rpc('is_admin');
      if (permissionError || !isAdmin) {
        await db.auth.signOut();
        throw new Error('Ce compte ne dispose pas d’un accès administrateur.');
      }
      router.replace('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setPending(false);
    }
  }
  return <div className="auth-shell"><div className="auth-card">
    <LockKeyhole size={25} color="#b58a7f" strokeWidth={1.4}/>
    <p className="eyebrow" style={{ marginTop: 20 }}>ESPACE RÉSERVÉ</p>
    <h1>Connexion <em>privée</em></h1>
    <p>Connectez-vous pour gérer les articles et les documents du site.</p>
    <form onSubmit={submit}>
      <div className="form-field"><label htmlFor="email">Adresse e-mail</label><input id="email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required placeholder="adresse@email.fr"/></div>
      <div className="form-field"><label htmlFor="password">Mot de passe</label><input id="password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required/></div>
      {error && <div className="error-box" role="alert">{error}</div>}
      <button className="btn btn-primary" type="submit" disabled={pending} style={{ width: '100%', marginTop: 17 }}>{pending ? 'Connexion…' : 'Se connecter'} <ArrowRight size={17}/></button>
    </form>
    <p style={{ textAlign: 'center', marginTop: 28 }}><Link href="/">← Retour au site</Link></p>
  </div></div>;
}

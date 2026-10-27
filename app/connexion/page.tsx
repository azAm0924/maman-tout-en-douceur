'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getBrowserClient } from '@/lib/data';
import { TurnstileCaptcha, type TurnstileHandle } from '@/components/turnstile-captcha';

type Mode = 'login' | 'register' | 'reset';

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || '';

export default function AccountAuth() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaRef = useRef<TurnstileHandle>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const db = getBrowserClient();
    if (!db) return;
    void db.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await db.rpc('is_admin');
      router.replace(data ? '/admin' : '/compte');
    });
  }, [router]);

  function switchMode(next: Mode) {
    setMode(next);
    setCaptchaToken('');
    captchaRef.current?.reset();
    setError('');
    setMessage('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError('');
    setMessage('');
    if (!turnstileSiteKey) {
      setError('Turnstile n’est pas configuré. Ajoutez NEXT_PUBLIC_TURNSTILE_SITE_KEY dans Vercel.');
      return;
    }
    if (!captchaToken) {
      setError('Terminez le contrôle de sécurité avant de continuer.');
      return;
    }
    const db = getBrowserClient();
    if (!db) {
      setError('Configuration Supabase manquante.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'register') {
        const { error: authError } = await db.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/compte`,
            captchaToken,
          },
        });
        if (authError) throw authError;
        setMessage('Compte demandé. Vérifiez votre boîte e-mail pour confirmer votre inscription, puis connectez-vous.');
        setMode('login');
        setPassword('');
      } else if (mode === 'reset') {
        const { error: authError } = await db.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reinitialiser`,
          captchaToken,
        });
        if (authError) throw authError;
        setMessage('Si cette adresse possède un compte, un e-mail de réinitialisation a été envoyé.');
      } else {
        const { error: authError } = await db.auth.signInWithPassword({
          email,
          password,
          options: { captchaToken },
        });
        if (authError) throw authError;
        const { data: isAdmin } = await db.rpc('is_admin');
        router.replace(isAdmin ? '/admin' : '/compte');
        router.refresh();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Impossible de terminer cette opération.');
    } finally {
      // Turnstile tokens expire and are single-use, including after a failed authentication.
      setCaptchaToken('');
      captchaRef.current?.reset();
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">MAMAN TOUT EN DOUCEUR</p>
        <h1>{mode === 'login' ? 'Bienvenue !' : mode === 'register' ? 'Créer mon compte' : 'Mot de passe oublié'}</h1>
        <p>
          {mode === 'register'
            ? 'Retrouvez vos commandes, vos favoris et vos achats PDF.'
            : mode === 'reset'
              ? 'Nous vous enverrons un lien sécurisé.'
              : 'Connectez-vous à votre espace personnel.'}
        </p>

        <form onSubmit={submit}>
          <div className="form-field">
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {mode !== 'reset' && (
            <div className="form-field">
              <label htmlFor="password">Mot de passe</label>
              <input id="password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}

          {turnstileSiteKey ? (
            <TurnstileCaptcha ref={captchaRef} siteKey={turnstileSiteKey} onToken={setCaptchaToken} />
          ) : (
            <p className="error-box" role="alert">CAPTCHA non configuré : renseigne NEXT_PUBLIC_TURNSTILE_SITE_KEY dans Vercel et redéploie le site.</p>
          )}

          {error && <p role="alert" className="error-box">{error}</p>}
          {message && <p role="status" className="success-box">{message}</p>}
          <button type="submit" className="btn btn-primary" disabled={busy || !turnstileSiteKey || !captchaToken}>
            {busy ? 'Traitement…' : mode === 'register' ? 'Créer mon compte' : mode === 'reset' ? 'Envoyer le lien' : 'Se connecter'}
          </button>
        </form>

        <div className="account-auth-links">
          <button type="button" onClick={() => switchMode(mode === 'register' ? 'login' : 'register')}>
            {mode === 'register' ? 'Déjà un compte ? Connexion' : 'Créer un compte client'}
          </button>
          <button type="button" onClick={() => switchMode(mode === 'reset' ? 'login' : 'reset')}>
            {mode === 'reset' ? 'Retour à la connexion' : 'Mot de passe oublié ?'}
          </button>
        </div>
        <p><Link href="/">← Retour au site</Link></p>
      </section>
    </main>
  );
}

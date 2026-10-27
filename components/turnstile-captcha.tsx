'use client';

import Script from 'next/script';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

// Turnstile's explicit rendering avoids duplicate widgets when Next.js changes routes.
type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme: 'light' | 'dark' | 'auto';
      size: 'normal' | 'flexible' | 'compact';
      callback: (token: string) => void;
      'expired-callback': () => void;
      'timeout-callback': () => void;
      'error-callback': () => void;
    },
  ) => string | undefined;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type TurnstileHandle = { reset: () => void };

type Props = {
  siteKey: string;
  onToken: (token: string) => void;
};

export const TurnstileCaptcha = forwardRef<TurnstileHandle, Props>(function TurnstileCaptcha(
  { siteKey, onToken },
  ref,
) {
  const host = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const [scriptReady, setScriptReady] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!scriptReady || !host.current || !window.turnstile || !siteKey) return;

    const id = window.turnstile.render(host.current, {
      sitekey: siteKey,
      theme: 'light',
      size: window.innerWidth < 480 ? 'compact' : 'flexible',
      callback: (token) => {
        onTokenRef.current(token);
        setNotice('');
      },
      'expired-callback': () => {
        onTokenRef.current('');
        setNotice('La vérification a expiré. Recommencez le contrôle de sécurité.');
      },
      'timeout-callback': () => {
        onTokenRef.current('');
        setNotice('Le contrôle a expiré. Réessayez.');
      },
      'error-callback': () => {
        onTokenRef.current('');
        setNotice('Impossible de valider la vérification. Rechargez la page si le problème persiste.');
      },
    });
    if (typeof id === 'string') widgetId.current = id;

    return () => {
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          // Widget can already be removed during navigation.
        }
      }
      widgetId.current = null;
    };
  }, [scriptReady, siteKey]);

  useImperativeHandle(ref, () => ({
    reset() {
      onTokenRef.current('');
      setNotice('');
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetId.current);
        } catch {
          setNotice('Rechargez la page pour recommencer la vérification.');
        }
      }
    },
  }), []);

  return (
    <div className="captcha-field">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setNotice('Le contrôle de sécurité ne peut pas se charger. Vérifiez votre connexion ou votre bloqueur de scripts.')}
      />
      <div ref={host} className="captcha-widget" aria-label="Vérification anti-robot" />
      {!scriptReady && <p className="captcha-help" role="status">Chargement du contrôle de sécurité…</p>}
      {notice && <p className="captcha-error" role="alert">{notice}</p>}
    </div>
  );
});

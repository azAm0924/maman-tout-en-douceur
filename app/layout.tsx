import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ScrollReveal } from '@/components/scroll-reveal';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'),
  title: { default: 'Maman tout en douceur | Conseils autour de la maternité', template: '%s | Maman tout en douceur' },
  description: 'Un cocon de conseils et de ressources pour vivre la grossesse, la naissance et les premiers instants avec bébé, tout en douceur.',
  openGraph: { title: 'Maman tout en douceur', description: 'Un cocon de douceur pour les futurs et jeunes parents.', type: 'website', locale: 'fr_FR' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body><Header /><ScrollReveal /><main id="contenu">{children}</main><Footer /></body></html>;
}

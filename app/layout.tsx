import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ScrollReveal } from '@/components/scroll-reveal';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'),
  title: { default: 'Maman tout en douceur | Livrets & supports pédagogiques', template: '%s | Maman tout en douceur' },
  description: 'Livrets, fiches et supports pédagogiques pour accompagner les parents et les tout-petits avec douceur.',
  openGraph: { title: 'Maman tout en douceur', description: 'Des livrets et supports pédagogiques pensés avec le cœur pour les parents et les tout-petits.', type: 'website', locale: 'fr_FR' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body><Header /><ScrollReveal /><main id="contenu">{children}</main><Footer /></body></html>;
}

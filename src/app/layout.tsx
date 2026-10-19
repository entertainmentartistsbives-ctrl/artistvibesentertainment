import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import FloatingContact from '@/components/FloatingContact/FloatingContact';

import type { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.artistvibes.in'),
  title: {
    default: 'Artistvibes Entertainment — Premium Artist & Celebrity Management',
    template: '%s | Artistvibes Entertainment',
  },
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
    ],
    apple: '/logo.png',
    shortcut: '/logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Artistvibes',
  },
  applicationName: 'Artistvibes',
  description:
    'Artistvibes Entertainment is a 360° artist, celebrity, and live show management company. Book singers, live bands, DJs, comedians, anchors, dancers & more for weddings, corporate events, college festivals, and ticketed concerts across India.',
  keywords: [
    'artist management india',
    'celebrity booking india',
    'live band for wedding mumbai',
    'DJ booking india',
    'singer for corporate event',
    'artistvibes entertainment',
    'Abhishek Pandey artist manager',
    'luxury wedding entertainment india',
    'musical phera concept',
    'destination wedding entertainment',
  ],
  authors: [{ name: 'Artistvibes Entertainment' }],
  creator: 'Artistvibes Entertainment',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Artistvibes Entertainment',
    title: 'Artistvibes Entertainment — Premium Artist & Celebrity Management',
    description:
      "India's most trusted 360\u00b0 artist & celebrity management brand. Delivering curated talent, iconic stage moments, and luxury entertainment experiences.",
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Artistvibes Entertainment — Premium Artist & Celebrity Management',
    description: 'Book singers, live bands, DJs, comedians & celebrities for your events across India and globally.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main style={{ flex: 1, paddingTop: 'var(--header-height)' }}>
          {children}
        </main>
        <Footer />
        <FloatingContact />
      </body>
    </html>
  );
}

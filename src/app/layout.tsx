import type { Metadata } from 'next';
import { Unbounded } from 'next/font/google';
import './globals.css';

const unbounded = Unbounded({
  subsets: ['latin'],
  variable: '--font-unbounded',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: 'Nara',
  description: "Ton prochain hit mérite mieux qu'un brouillon perdu.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='fr' className={`dark ${unbounded.variable}`}>
      {/* Polices centralisées dans globals.css */}
      <body className='font-arimo antialiased bg-[#050505] text-white'>
        {children}
      </body>
    </html>
  );
}

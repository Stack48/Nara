import { Syne, Arimo } from 'next/font/google';
import "./globals.css";
import "@/lib/amplify";

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['700', '800']
});

const arimo = Arimo({
  subsets: ['latin'],
  variable: '--font-arimo'
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${syne.variable} ${arimo.variable} dark`}>
      <body className="bg-[#050505] antialiased">
        {children}
      </body>
    </html>
  );
}
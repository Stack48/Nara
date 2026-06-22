import type { Metadata } from 'next';
import { Unbounded, Arimo, Inter } from 'next/font/google';
import './globals.css';
import { Toast } from '@/components/library/Toast';

// Configuration de Unbounded
const unbounded = Unbounded({
	subsets: ["latin"],
	variable: "--font-unbounded",
	weight: ["300", "400", "500", "600", "700", "800", "900"],
});

// Configuration d'Arimo
const arimo = Arimo({
	subsets: ["latin"],
	variable: "--font-arimo", // Le nom qu'on a mis dans le CSS
	weight: ["400", "500", "600", "700"],
});

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
	title: "Nara",
	description: "Ton prochain hit mérite mieux qu'un brouillon perdu.",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
    return (
        <html lang="fr" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: `
                  try {
                    const t = localStorage.getItem('nara-theme') || 'light';
                    document.documentElement.classList.toggle('dark', t === 'dark');
                  } catch(e) {}
                `}} />
            </head>
            {/* On applique les variables et la police par défaut (Arimo et Unbounded) */}
            <body
                className={`${unbounded.variable} ${arimo.variable} ${inter.variable} font-arimo antialiased bg-n-bg text-n-text`}
            >
                <>{children}</>
                <Toast />
            </body>
        </html>
    );
}

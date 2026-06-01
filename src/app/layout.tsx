import type { Metadata } from "next";
import { Syne, Arimo } from "next/font/google"; // On importe les deux
// import { Layout } from "@/components/nav/Layout";
import "./globals.css";

// Configuration de Syne
const syne = Syne({
    subsets: ["latin"],
    variable: "--font-syne", // Le nom qu'on a mis dans le CSS
    weight: ["700", "800"],
});

// Configuration d'Arimo
const arimo = Arimo({
    subsets: ["latin"],
    variable: "--font-arimo", // Le nom qu'on a mis dans le CSS
    weight: ["400", "500", "600", "700"],
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
        <html lang="fr" className="dark">
            {/* On applique les variables et la police par défaut (Arimo) */}
            <body
                className={`${syne.variable} ${arimo.variable} font-arimo antialiased bg-[#050505] text-white`}
            >
                <>{children}</>
            </body>
        </html>
    );
}

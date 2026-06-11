"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    User, Settings, Bell, Globe, Key,
    Shield, Users, HelpCircle, FileText,
    Zap, CreditCard, Crown, ArrowLeft
} from "lucide-react";

const sections = [
    {
        title: "Compte",
        items: [
            { icon: User, label: "Mon profil", href: "/settings/profile", active: true },
            { icon: CreditCard, label: "Abonnement", href: "/settings/billing", active: false },
            { icon: Crown, label: "Passer à Pro", href: "/settings/upgrade", active: false },
        ]
    },
    {
        title: "Préférences",
        items: [
            { icon: Settings, label: "Général", href: "/settings/general", active: false },
            { icon: Bell, label: "Notifications", href: "/settings/notifications", active: false },
            { icon: Globe, label: "Langue & région", href: "/settings/language", active: false },
        ]
    },
    {
        title: "Sécurité",
        items: [
            { icon: Key, label: "Mot de passe", href: "/settings/security", active: false },
            { icon: Shield, label: "Confidentialité", href: "/settings/privacy", active: false },
            { icon: Users, label: "Collaborateurs", href: "/settings/collaborators", active: false },
        ]
    },
    {
        title: "Support",
        items: [
            { icon: HelpCircle, label: "Aide", href: "/help", active: false },
            { icon: FileText, label: "Conditions", href: "/terms", active: false },
            { icon: Zap, label: "Nouveautés", href: "/changelog", active: false },
        ]
    },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex h-full min-h-0 font-arimo text-white">
            {/* Sidebar */}
            <aside className="w-56 border-r border-neutral-800/60 flex-shrink-0 flex flex-col py-6 px-3 overflow-y-auto">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-xs text-neutral-500 hover:text-white transition-colors mb-6 px-2"
                >
                    <ArrowLeft size={14} />
                    <span>Retour</span>
                </Link>

                <h2 className="font-syne font-bold text-white text-sm px-2 mb-4">Paramètres</h2>

                {sections.map((section) => (
                    <div key={section.title} className="mb-4">
                        <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest px-2 mb-1">
                            {section.title}
                        </p>
                        {section.items.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.active ? item.href : "#"}
                                    className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs transition-colors ${isActive
                                        ? "bg-[#D90097]/10 text-[#D90097]"
                                        : item.active
                                            ? "text-neutral-400 hover:text-white hover:bg-neutral-900/40"
                                            : "text-neutral-700 cursor-not-allowed"
                                        }`}
                                >
                                    <item.icon size={13} />
                                    <span>{item.label}</span>
                                    {!item.active && (
                                        <span className="ml-auto text-[8px] bg-neutral-800/80 text-neutral-600 px-1 py-0.5 rounded font-bold uppercase">
                                            Bientôt
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </aside>

            {/* Content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
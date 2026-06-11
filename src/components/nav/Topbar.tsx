"use client";

import {
    Sun, Bell, User, Settings, FileText, LogOut,
    CreditCard, Shield, HelpCircle, Users,
    Zap, Globe, Key, ChevronRight, Crown
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, getCurrentUser } from "aws-amplify/auth";
import "@/lib/amplify";

const menuSections = [
    {
        title: "Compte",
        items: [
            { icon: User, label: "Mon profil", href: "/settings/profile", active: true },
            { icon: CreditCard, label: "Abonnement & facturation", href: "/settings/billing", active: false },
            { icon: Crown, label: "Passer à Pro", href: "/settings/upgrade", active: false, highlight: true },
        ]
    },
    {
        title: "Préférences",
        items: [
            { icon: Settings, label: "Paramètres généraux", href: "/settings", active: false },
            { icon: Bell, label: "Notifications", href: "/settings/notifications", active: false },
            { icon: Globe, label: "Langue & région", href: "/settings/language", active: false },
        ]
    },
    {
        title: "Sécurité",
        items: [
            { icon: Key, label: "Mot de passe & sécurité", href: "/settings/security", active: false },
            { icon: Shield, label: "Confidentialité", href: "/settings/privacy", active: false },
            { icon: Users, label: "Collaborateurs", href: "/settings/collaborators", active: false },
        ]
    },
    {
        title: "Support",
        items: [
            { icon: HelpCircle, label: "Aide & documentation", href: "/help", active: false },
            { icon: FileText, label: "Conditions d'utilisation", href: "/terms", active: false },
            { icon: Zap, label: "Nouveautés", href: "/changelog", active: false },
        ]
    },
];

export const Topbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [userEmail, setUserEmail] = useState<string>("");
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await getCurrentUser();
                setUserEmail(user.signInDetails?.loginId ?? "");
            } catch { }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        window.addEventListener("mousedown", handleClickOutside);
        return () => window.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await signOut();
        window.location.href = "/login";
    };

    return (
        <header className="flex items-center justify-between h-14 px-6 border-b border-neutral-800/60 shrink-0 bg-black z-40">
            <h1 className="tracking-wide"></h1>

            <div className="flex items-center gap-3 text-neutral-400">
                <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-neutral-800 bg-black hover:text-white hover:bg-neutral-900 transition-colors">
                    <Sun size={18} />
                </button>

                <div className="w-px h-5 bg-neutral-800 mx-1"></div>

                <button className="w-9 h-9 flex items-center justify-center rounded-full border border-neutral-800 bg-black hover:bg-neutral-900 transition-colors">
                    <div className="relative flex items-center justify-center text-red-600">
                        <Bell size={18} />
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-black" />
                    </div>
                </button>

                {/* Avatar + Menu */}
                <div ref={menuRef} className="relative">
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="w-9 h-9 overflow-hidden rounded-full border border-neutral-800 flex-shrink-0 hover:opacity-80 transition-opacity flex items-center justify-center bg-gradient-to-br from-[#AB0063] to-[#D50093]"
                    >
                        <span className="text-white text-xs font-bold">
                            {userEmail?.[0]?.toUpperCase() ?? "N"}
                        </span>
                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 top-[calc(100%+8px)] w-64 bg-[#111111] border border-neutral-800 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] z-[999] overflow-hidden animate-in fade-in zoom-in-95 duration-150">

                            {/* Header user */}
                            <div className="px-4 py-3 border-b border-neutral-800/60 bg-neutral-900/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#AB0063] to-[#D50093] flex items-center justify-center text-white text-xs font-bold">
                                        {userEmail?.[0]?.toUpperCase() ?? "N"}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white truncate max-w-[160px]">{userEmail || "Mon compte"}</p>
                                        <span className="text-[9px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded font-bold uppercase">
                                            Gratuit
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Sections */}
                            <div className="max-h-[70vh] overflow-y-auto py-1">
                                {menuSections.map((section, sIndex) => (
                                    <div key={section.title}>
                                        <p className="px-4 pt-3 pb-1 text-[9px] font-bold text-neutral-600 uppercase tracking-widest">
                                            {section.title}
                                        </p>
                                        {section.items.map((item) => (
                                            <button
                                                key={item.label}
                                                onClick={() => {
                                                    if (item.active) {
                                                        router.push(item.href);
                                                        setMenuOpen(false);
                                                    }
                                                }}
                                                className={`w-full flex items-center justify-between px-4 py-2 text-xs transition-colors ${item.active
                                                        ? "text-neutral-300 hover:text-white hover:bg-white/5 cursor-pointer"
                                                        : "text-neutral-600 cursor-not-allowed"
                                                    } ${'highlight' in item && item.highlight ? "text-[#D90097]" : ""}`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <item.icon size={13} />
                                                    <span>{item.label}</span>
                                                </div>
                                                {!item.active && (
                                                    <span className="text-[9px] bg-neutral-800/80 text-neutral-600 px-1.5 py-0.5 rounded font-bold uppercase">
                                                        Bientôt
                                                    </span>
                                                )}
                                                {item.active && (
                                                    <ChevronRight size={12} className="text-neutral-600" />
                                                )}
                                            </button>
                                        ))}
                                        {sIndex < menuSections.length - 1 && (
                                            <div className="border-b border-neutral-800/40 mx-3 mt-2" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Logout */}
                            <div className="border-t border-neutral-800/60 py-1">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-500 hover:text-red-400 hover:bg-red-500/5 transition-colors cursor-pointer"
                                >
                                    <LogOut size={13} />
                                    <span>Se déconnecter</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
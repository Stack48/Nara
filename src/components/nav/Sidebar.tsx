"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    Home,
    FolderOpen,
    BookDashed,
    Users,
    Trash2,
    ChevronLeft,
    Plus,
} from "lucide-react";

import avisProfil from "@/assets/user/haslem.png";

interface SidebarProps {
    collapsed: boolean;
    toggleSidebar: () => void;
}

export const Sidebar = ({ collapsed, toggleSidebar }: SidebarProps) => {
    const pathname = usePathname();

    const navLinks = [
        { label: "Home", href: "/", icon: Home },
        { label: "Drafts", href: "/drafts", icon: BookDashed },
        { label: "My Projects", href: "#", icon: FolderOpen },
        { label: "Shared with me", href: "#", icon: Users },
        { label: "Deleted", href: "#", icon: Trash2 },
    ];

    // OPTIMISATION : Centralisation de la classe de visibilité pour les textes
    // On retire "hidden" et "block" pour laisser la transition CSS se faire en douceur
    const textVisibilityClass = `whitespace-nowrap overflow-hidden transition-all duration-300 ${
        collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
    }`;

    return (
        <aside
            className={`relative flex flex-col h-screen bg-black border-r border-neutral-800/60 transition-all duration-300 z-50 flex-shrink-0 ${
                collapsed ? "w-16" : "w-56"
            }`}
        >
            {/* HEADER SIDEBAR (Logo) */}
            <div className="flex items-center justify-center h-14 border-b border-neutral-800/60">
                <h2 className="font-syne text-xl font-extrabold tracking-widest uppercase text-white transition-all duration-300 overflow-hidden whitespace-nowrap">
                    {collapsed ? "N" : "NARA"}
                </h2>
            </div>

            {/* TOGGLE BUTTON */}
            <button
                onClick={toggleSidebar}
                className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-black border border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-full flex items-center justify-center transition-all z-50 shadow-md"
            >
                <ChevronLeft
                    size={14}
                    className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
                />
            </button>

            {/* CONTENU SIDEBAR */}
            <div
                className={`flex flex-col flex-1 py-5 gap-5 overflow-y-auto overflow-x-hidden ${collapsed ? "px-3" : "px-4"}`}
            >
                {/* button create */}
                <button
                    className={`flex items-center justify-center bg-gradient-to-r from-[#AB0063] from-[0%] to-[#D50093] to-[100%] shadow-lg transition-all hover:scale-[1.02] hover:opacity-90 text-white font-bold rounded-lg h-10 ${
                        collapsed
                            ? "w-10 px-0 mx-auto"
                            : "w-10/12 mx-auto px-4 gap-2"
                    }`}
                >
                    <Plus size={20} className="flex-shrink-0" />
                    {/* Utilisation de la variable ici */}
                    <span className={textVisibilityClass}>Create</span>
                </button>

                {/* navigation */}
                <div className="flex flex-col gap-1 mt-4">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        const Icon = link.icon;

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center h-9 rounded-lg transition-colors relative group ${
                                    isActive
                                        ? "text-[#D90097] bg-[#D90097]/[6%]"
                                        : "text-neutral-400 hover:text-white hover:bg-neutral-900/30"
                                } ${collapsed ? "justify-center px-0 w-10 mx-auto" : "px-3 gap-3 w-full"}`}
                            >
                                <Icon size={16} className="flex-shrink-0" />

                                {/* Utilisation de la variable ici */}
                                <span
                                    className={`text-sm ${textVisibilityClass}`}
                                >
                                    {link.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* FOOTER SIDEBAR (Profil) */}
            <div
                className={`flex items-center h-16 border-t border-neutral-800/60 transition-all duration-300 overflow-hidden ${
                    collapsed ? "justify-center px-0" : "px-4 gap-3"
                }`}
            >
                <div className="w-10 h-10 overflow-hidden rounded-full bg-neutral-800 flex-shrink-0 relative">
                    <Image
                        src={avisProfil}
                        alt="Profil Udonis Haslem"
                        fill
                        className="object-cover"
                        sizes="40px"
                    />
                </div>
                {/* Utilisation de la variable ici */}
                <div className={`flex flex-col ${textVisibilityClass}`}>
                    <span className="font-bold text-sm tracking-wide text-white">
                        Udonis Haslem
                    </span>
                    <span className="text-neutral-500 text-xs mt-0.5">
                        Pro Plan
                    </span>
                </div>
            </div>
        </aside>
    );
};

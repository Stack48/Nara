"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
    Home,
    FolderOpen,
    BookDashed,
    Users,
    Trash2,
    ChevronLeft,
    ChevronDown,
    Plus,
    Clock,
    Heart,
    Music,
} from "lucide-react";

import avisProfil from "@/assets/user/haslem.png";

// --- MOCK DATA (À remplacer plus tard par tes données réelles/API) ---
// Triés par ordre alphabétique comme demandé
const realDrafts = [
    { id: "breathe", title: "breathe" },
    { id: "Love_Is_Only_A_Feeling", title: "Love Is Only A Feeling" },
    { id: "MHM", title: "MHM" },
    { id: "test", title: "test" },
    { id: "Time_killers", title: "Time killers" },
    { id: "untitled_01", title: "untitled 01" },
    { id: "WIDE_Open", title: "WIDE Open" },
];

const realProjects = [
    {
        id: "Alfredo_2",
        title: "Alfredo 2",
        tracks: [],
    },
    {
        id: "Aquemini",
        title: "Aquemini",
        tracks: [],
    },
    {
        id: "Let_God_Sort_Em_Out",
        title: "Let God Sort Em Out",
        tracks: [
            { id: "Ace_Trumpets", title: "Ace Trumpets" },
            { id: "All_Things_Considered", title: "All Things Considered" },
            { id: "By_The_Grace_Of_God", title: "By The Grace Of God" },
            { id: "Chains_Whips", title: "Chains & Whips" },
            { id: "EBIDTA", title: "E.B.I.D.T.A." },
            { id: "FICO", title: "F.I.C.O." },
            { id: "Inglorious_Bastards", title: "Inglorious Bastards" },
            { id: "Let_God_Sort_Em_Out_Chandeliers", title: "Let God Sort Em Out/Chandeliers" },
            { id: "MTBTTF", title: "M.T.B.T.T.F." },
            { id: "POV", title: "P.O.V." },
            { id: "So_Be_It", title: "So Be It" },
            { id: "So_Far_Ahead", title: "So Far Ahead" },
            { id: "The_Birds_Dont_Sing", title: "The Birds Don't Sing" },
        ],
    },
    {
        id: "Microphone_Champion",
        title: "Microphone Champion",
        tracks: [],
    },
    {
        id: "Mr_Clean_Modern_Day_Mugging",
        title: "Mr. Clean / Modern Day Mugging",
        tracks: [],
    },
    {
        id: "The_Infamous",
        title: "The Infamous",
        tracks: [],
    },
    {
        id: "This_Is_America",
        title: "This Is America",
        tracks: [],
    },
    {
        id: "Who_Coppin",
        title: "Who Coppin'",
        tracks: [],
    },
];

interface SidebarProps {
    collapsed: boolean;
    toggleSidebar: () => void;
    openCreateModal: () => void;
}

export const Sidebar = ({ collapsed, toggleSidebar, openCreateModal }: SidebarProps) => {
    const pathname = usePathname();
    const router = useRouter();

    // États pour gérer l'ouverture des sous-menus (accordéons)
    const [draftsOpen, setDraftsOpen] = useState(false);
    const [projectsOpen, setProjectsOpen] = useState(false);
    
    // Pour ouvrir chaque projet individuellement, on stocke son ID dans un objet/état
    const [openProjectIds, setOpenProjectIds] = useState<Record<string, boolean>>({});

    const toggleProject = (id: string) => {
        setOpenProjectIds((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    // Liens simples (statiques)
    const topLinks = [
        { label: "Home", href: "/", icon: Home },
        { label: "Recents", href: "/recents", icon: Clock },
        { label: "Favorites", href: "/favorites", icon: Heart },
    ];

    const bottomLinks = [
        { label: "Shared with me", href: "/shared", icon: Users },
        { label: "Deleted", href: "/deleted", icon: Trash2 },
    ];

    // Visibilité du texte et éléments fluides
    const textVisibilityClass = `whitespace-nowrap overflow-hidden transition-all duration-300 ${
        collapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100"
    }`;

    // Helper pour le style des lignes actives/inactives
    const linkClass = (isActive: boolean) => `
        flex items-center h-9 rounded-lg transition-colors relative group text-sm select-none
        ${isActive ? "text-[#D90097] bg-[#D90097]/[6%]" : "text-neutral-400 hover:text-white hover:bg-neutral-900/30"}
        ${collapsed ? "justify-center px-0 w-10 mx-auto" : "px-3 gap-3 w-full"}
    `;

    return (
        <aside
            className={`relative flex flex-col h-screen bg-black border-r border-neutral-800/60 transition-all duration-300 z-50 flex-shrink-0 ${
                collapsed ? "w-16" : "w-60"
            }`}
        >
            {/* HEADER SIDEBAR (Logo) */}
            <div className="flex items-center justify-center h-14 border-b border-neutral-800/60 shrink-0">
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
            <div className={`flex flex-col flex-1 py-5 gap-4 overflow-y-auto overflow-x-hidden ${collapsed ? "px-1" : "px-3"}`}>
                
                {/* BUTTON CREATE */}
                <button
                    onClick={openCreateModal}
                    className={`flex items-center justify-center bg-gradient-to-r from-[#AB0063] from-[0%] to-[#D50093] to-[100%] shadow-lg transition-all hover:scale-[1.02] hover:opacity-90 text-white font-bold rounded-lg h-10 shrink-0 ${
                        collapsed ? "w-10 px-0 mx-auto" : "w-11/12 mx-auto px-4 gap-2"
                    }`}
                >
                    <Plus size={20} className="flex-shrink-0" />
                    <span className={textVisibilityClass}>Create</span>
                </button>

                {/* NAVIGATION PRINCIPALE */}
                <div className="flex flex-col gap-1 mt-2">
                    
                    {/* Liens du haut (Home, Recents, Favorites) */}
                    {topLinks.map((link) => (
                        <Link key={link.href} href={link.href} className={linkClass(pathname === link.href)}>
                            <link.icon size={16} className="flex-shrink-0" />
                            <span className={textVisibilityClass}>{link.label}</span>
                        </Link>
                    ))}

                    <hr className="border-neutral-800/60 my-1 mx-2 shrink-0" />

                    {/* --- SECTION DRAFTS (DÉROULANT) --- */}
                    <div className="flex flex-col shrink-0">
                        <button
                            onClick={() => router.push("/drafts")}
                            className={linkClass(pathname.startsWith("/drafts"))}
                        >
                            <BookDashed size={16} className="flex-shrink-0" />
                            {!collapsed && (
                                <div className={`flex items-center justify-between flex-1 ${textVisibilityClass}`}>
                                    <span>Drafts</span>
                                    <div 
                                        className="p-1 hover:bg-neutral-800/50 rounded transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDraftsOpen(!draftsOpen);
                                        }}
                                    >
                                        <ChevronDown
                                            size={14}
                                            className={`transition-transform duration-200 ${draftsOpen ? "rotate-180" : ""}`}
                                        />
                                    </div>
                                </div>
                            )}
                        </button>

                        {/* Liste des Drafts si ouvert et non-collapsed */}
                        {!collapsed && draftsOpen && (
                            <div className="flex flex-col pl-7 mt-0.5 border-l border-neutral-800/40 ml-5 gap-0.5">
                                {realDrafts.map((draft) => (
                                    <Link
                                        key={draft.id}
                                        href={`/drafts/${draft.id}`}
                                        className="flex items-center h-8 px-2 text-xs text-neutral-400 hover:text-white rounded-md hover:bg-neutral-900/40 transition-colors whitespace-nowrap overflow-hidden text-ellipsis"
                                    >
                                        <Music size={12} className="mr-2 text-neutral-600 shrink-0" />
                                        <span className="truncate">{draft.title}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* --- SECTION MY PROJECTS (DOUBLE DÉROULANT) --- */}
                    <div className="flex flex-col shrink-0">
                        <button
                            onClick={() => router.push("/projects")}
                            className={linkClass(pathname.startsWith("/projects"))}
                        >
                            <FolderOpen size={16} className="flex-shrink-0" />
                            {!collapsed && (
                                <div className={`flex items-center justify-between flex-1 ${textVisibilityClass}`}>
                                    <span>My Projects</span>
                                    <div 
                                        className="p-1 hover:bg-neutral-800/50 rounded transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setProjectsOpen(!projectsOpen);
                                        }}
                                    >
                                        <ChevronDown
                                            size={14}
                                            className={`transition-transform duration-200 ${projectsOpen ? "rotate-180" : ""}`}
                                        />
                                    </div>
                                </div>
                            )}
                        </button>

                        {/* Niveau 1 : Liste des projets */}
                        {!collapsed && projectsOpen && (
                            <div className="flex flex-col pl-4 mt-0.5 border-l border-neutral-800/40 ml-5 gap-0.5">
                                {realProjects.map((project) => {
                                    const isProjectOpen = !!openProjectIds[project.id];
                                    return (
                                        <div key={project.id} className="flex flex-col shrink-0">
                                            {/* Bouton du projet (Album) */}
                                            <button
                                                onClick={() => router.push(`/projects/${project.id}`)}
                                                className="flex items-center justify-between w-full h-8 px-2 text-xs text-neutral-400 hover:text-white rounded-md hover:bg-neutral-900/40 transition-colors"
                                            >
                                                <div className="flex items-center min-w-0">
                                                    <FolderOpen size={12} className="mr-2 text-neutral-500 shrink-0" />
                                                    <span className="truncate">{project.title}</span>
                                                </div>
                                                {project.tracks.length > 0 && (
                                                    <div 
                                                        className="p-1 hover:bg-neutral-800/50 rounded transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleProject(project.id);
                                                        }}
                                                    >
                                                        <ChevronDown
                                                            size={12}
                                                            className={`transition-transform duration-200 text-neutral-600 shrink-0 ${isProjectOpen ? "rotate-180" : ""}`}
                                                        />
                                                    </div>
                                                )}
                                            </button>

                                            {/* Niveau 2 : Sons à l'intérieur du projet */}
                                            {isProjectOpen && (
                                                <div className="flex flex-col pl-4 mt-0.5 border-l border-neutral-800/60 ml-4 gap-0.5 shrink-0">
                                                    {project.tracks.map((track) => (
                                                        <Link
                                                            key={track.id}
                                                            href={`/projects/${project.id}/${track.id}`}
                                                            className="flex items-center h-7 px-2 text-[11px] text-neutral-500 hover:text-[#D90097] rounded-md transition-colors whitespace-nowrap overflow-hidden text-ellipsis"
                                                        >
                                                            <Music size={10} className="mr-1.5 opacity-60 shrink-0" />
                                                            <span className="truncate">{track.title}</span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <hr className="border-neutral-800/60 my-1 mx-2 shrink-0" />

                    {/* Liens du bas (Shared, Deleted) */}
                    {bottomLinks.map((link) => (
                        <Link key={link.href} href={link.href} className={linkClass(pathname === link.href)}>
                            <link.icon size={16} className="flex-shrink-0" />
                            <span className={textVisibilityClass}>{link.label}</span>
                        </Link>
                    ))}

                </div>
            </div>

            {/* FOOTER SIDEBAR (Profil) */}
            <div
                className={`flex items-center h-16 border-t border-neutral-800/60 transition-all duration-300 overflow-hidden shrink-0 ${
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

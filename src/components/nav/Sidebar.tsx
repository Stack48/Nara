"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
    Home,
    FolderOpen,
    Users,
    Trash2,
    ChevronLeft,
    ChevronDown,
    Plus,
    Clock,
    Heart,
    Music,
} from "lucide-react";

import { useSongs, setSongProject } from "@/lib/songStore";
import { useProjects } from "@/lib/projectStore";
import avisProfil from "@/assets/user/haslem.png";

interface SidebarProps {
    collapsed: boolean;
    toggleSidebar: () => void;
    openCreateModal: () => void;
}

export const Sidebar = ({
    collapsed,
    toggleSidebar,
    openCreateModal,
}: SidebarProps) => {
    const pathname = usePathname();
    const router = useRouter();

    const songs = useSongs();
    const allProjects = useProjects();
    const projects = allProjects
        .filter((p) => !p.isDeleted)
        .sort((a, b) => a.title.localeCompare(b.title));

    const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(
        null,
    );
    const [confirmModal, setConfirmModal] = useState<{
        songId: string;
        songTitle: string;
        currentProjectName: string;
        targetProjectId: string;
        targetProjectTitle: string;
    } | null>(null);

    const handleDrop = (
        dragData: any,
        targetProjectId: string,
        targetProjectTitle: string,
    ) => {
        const {
            id: songId,
            title: songTitle,
            projectId: currentProjectId,
            projectName: currentProjectName,
        } = dragData;

        // If already in target project, ignore
        if (currentProjectId === targetProjectId) {
            return;
        }

        // If currently in another project, trigger warning confirmation
        if (currentProjectId) {
            setConfirmModal({
                songId,
                songTitle,
                currentProjectName,
                targetProjectId,
                targetProjectTitle,
            });
        } else {
            // Standalone song, assign directly
            setSongProject(songId, targetProjectId, targetProjectTitle);
        }
    };

    // États pour gérer l'ouverture des sous-menus (accordéons)
    const [projectsOpen, setProjectsOpen] = useState(false);

    // Pour ouvrir chaque projet individuellement, on stocke son ID dans un objet/état
    const [openProjectIds, setOpenProjectIds] = useState<
        Record<string, boolean>
    >({});

    const toggleProject = (id: string) => {
        setOpenProjectIds((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    // Liens simples (statiques)
    const topLinks = [
        { label: "Home", href: "/dashboard", icon: Home },
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
            <div
                className={`flex flex-col flex-1 py-5 gap-4 overflow-y-auto overflow-x-hidden ${collapsed ? "px-1" : "px-3"}`}
            >
                {/* BUTTON CREATE */}
                <button
                    onClick={openCreateModal}
                    className={`flex items-center justify-center bg-gradient-to-r from-[#AB0063] from-[0%] to-[#D50093] to-[100%] shadow-lg transition-all hover:scale-[1.02] hover:opacity-90 text-white font-bold rounded-lg h-10 shrink-0 ${
                        collapsed
                            ? "w-10 px-0 mx-auto"
                            : "w-11/12 mx-auto px-4 gap-2"
                    }`}
                >
                    <Plus size={20} className="flex-shrink-0" />
                    <span className={textVisibilityClass}>New Song</span>
                </button>

                {/* NAVIGATION PRINCIPALE */}
                <div className="flex flex-col gap-1 mt-2">
                    {/* Liens du haut (Home, Recents, Favorites) */}
                    {topLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={linkClass(pathname === link.href)}
                        >
                            <link.icon size={16} className="flex-shrink-0" />
                            <span className={textVisibilityClass}>
                                {link.label}
                            </span>
                        </Link>
                    ))}

                    <hr className="border-neutral-800/60 my-1 mx-2 shrink-0" />

                    {/* --- SECTION SONGS (LIEN SIMPLE) --- */}
                    <Link
                        href="/songs"
                        className={linkClass(
                            pathname === "/songs" ||
                                pathname.startsWith("/songs"),
                        )}
                    >
                        <Music size={16} className="flex-shrink-0" />
                        <span className={textVisibilityClass}>Songs</span>
                    </Link>

                    {/* --- SECTION MY PROJECTS (DOUBLE DÉROULANT) --- */}
                    <div className="flex flex-col shrink-0">
                        <button
                            onClick={() => router.push("/projects")}
                            className={linkClass(
                                pathname.startsWith("/projects"),
                            )}
                        >
                            <FolderOpen size={16} className="flex-shrink-0" />
                            {!collapsed && (
                                <div
                                    className={`flex items-center justify-between flex-1 ${textVisibilityClass}`}
                                >
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
                                <button
                                    onClick={() => {
                                        window.dispatchEvent(
                                            new CustomEvent(
                                                "open-create-modal",
                                                { detail: { type: "project" } },
                                            ),
                                        );
                                    }}
                                    className="flex items-center w-full h-8 px-2 text-xs text-neutral-400 hover:text-white hover:bg-neutral-900/40 rounded-md transition-all border border-dashed border-neutral-800/80 hover:border-[#D90097]/45 shrink-0 mb-1 group"
                                >
                                    <Plus
                                        size={12}
                                        className="mr-2 text-neutral-500 group-hover:text-[#D90097] shrink-0 transition-colors"
                                    />
                                    <span className="truncate font-semibold">
                                        New Project
                                    </span>
                                </button>
                                {projects.map((project) => {
                                    const isProjectOpen =
                                        !!openProjectIds[project.id];
                                    const projectTracks = songs.filter(
                                        (s) =>
                                            s.projectId === project.id &&
                                            !s.isDeleted,
                                    );
                                    const isDraggedOver =
                                        dragOverProjectId === project.id;

                                    return (
                                        <div
                                            key={project.id}
                                            className="flex flex-col shrink-0"
                                        >
                                            {/* Bouton du projet (Album) */}
                                            <button
                                                onClick={() =>
                                                    router.push(
                                                        `/projects/${project.id}`,
                                                    )
                                                }
                                                onDragOver={(e) => {
                                                    e.preventDefault();
                                                    setDragOverProjectId(
                                                        project.id,
                                                    );
                                                }}
                                                onDragLeave={() => {
                                                    setDragOverProjectId(null);
                                                }}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    setDragOverProjectId(null);
                                                    try {
                                                        const dragData =
                                                            JSON.parse(
                                                                e.dataTransfer.getData(
                                                                    "text/plain",
                                                                ),
                                                            );
                                                        handleDrop(
                                                            dragData,
                                                            project.id,
                                                            project.title,
                                                        );
                                                    } catch (err) {
                                                        console.error(
                                                            "Failed to parse drag data",
                                                            err,
                                                        );
                                                    }
                                                }}
                                                className={`flex items-center justify-between w-full h-8 px-2 text-xs rounded-md transition-all ${
                                                    isDraggedOver
                                                        ? "bg-[#D90097]/25 border border-dashed border-[#D90097]/60 text-white scale-[1.03]"
                                                        : "text-neutral-400 hover:text-white hover:bg-neutral-900/40 border border-transparent"
                                                }`}
                                            >
                                                <div className="flex items-center min-w-0 pointer-events-none">
                                                    <FolderOpen
                                                        size={12}
                                                        className="mr-2 text-neutral-500 shrink-0"
                                                    />
                                                    <span className="truncate">
                                                        {project.title}
                                                    </span>
                                                    {project.isFavorite && (
                                                        <Heart
                                                            size={10}
                                                            className="ml-1.5 text-red-500 fill-red-500 shrink-0"
                                                        />
                                                    )}
                                                </div>
                                                {projectTracks.length > 0 && (
                                                    <div
                                                        className="p-1 hover:bg-neutral-800/50 rounded transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleProject(
                                                                project.id,
                                                            );
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
                                                    {projectTracks.map(
                                                        (track) => (
                                                            <Link
                                                                key={track.id}
                                                                href={`/projects/${project.id}/${track.id}`}
                                                                className="flex items-center h-7 px-2 text-[11px] text-neutral-500 hover:text-[#D90097] rounded-md transition-colors whitespace-nowrap overflow-hidden text-ellipsis"
                                                            >
                                                                <Music
                                                                    size={10}
                                                                    className="mr-1.5 opacity-60 shrink-0"
                                                                />
                                                                <span className="truncate">
                                                                    {
                                                                        track.title
                                                                    }
                                                                </span>
                                                            </Link>
                                                        ),
                                                    )}
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
                        <Link
                            key={link.href}
                            href={link.href}
                            className={linkClass(
                                pathname === link.href ||
                                    pathname.startsWith(`${link.href}/`),
                            )}
                        >
                            <link.icon size={16} className="flex-shrink-0" />
                            <span className={textVisibilityClass}>
                                {link.label}
                            </span>
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

            {/* Warning Confirmation Modal for Drag & Drop */}
            {confirmModal && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#121212] border border-neutral-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-[#D90097]/10 flex items-center justify-center text-[#D90097]">
                                <Music size={20} />
                            </div>
                            <h3 className="font-syne font-bold text-white text-base">
                                Move song?
                            </h3>
                        </div>

                        {/* Body */}
                        <p className="text-neutral-400 text-xs leading-relaxed mb-6">
                            The song{" "}
                            <span className="text-white font-semibold">
                                "{confirmModal.songTitle}"
                            </span>{" "}
                            is already in the project{" "}
                            <span className="text-white font-semibold">
                                "{confirmModal.currentProjectName}"
                            </span>
                            . Do you want to move it to{" "}
                            <span className="text-white font-semibold">
                                "{confirmModal.targetProjectTitle}"
                            </span>
                            ?
                        </p>

                        {/* Actions */}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmModal(null)}
                                className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setSongProject(
                                        confirmModal.songId,
                                        confirmModal.targetProjectId,
                                        confirmModal.targetProjectTitle,
                                    );
                                    setConfirmModal(null);
                                }}
                                className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#AB0063] to-[#D50093] rounded-lg shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all cursor-pointer"
                            >
                                Move Song
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
};

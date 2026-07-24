"use client";

import { useState, useRef, useEffect } from "react";
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
    Bell,
    Pencil,
    ChevronRight,
    Settings,
    LogOut,
    LayoutTemplate,
    Search,
} from "lucide-react";

import { setSongProject } from "@/lib/songStore";
import { useApiProjects } from "@/hooks/useApiProjects";
import { useApiSongs } from "@/hooks/useApiSongs";
import avisProfil from "@/assets/user/haslem.png";

interface SidebarProps {
    collapsed: boolean;
    toggleSidebar: () => void;
    setCollapsed?: (val: boolean) => void;
}

export const Sidebar = ({
    collapsed,
    toggleSidebar,
    setCollapsed,
}: SidebarProps) => {
    const pathname = usePathname();
    const router = useRouter();

    const { songs } = useApiSongs();

    const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const projectsDragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hoverProjectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hoverProjectIdRef = useRef<string | null>(null);

    const [userName, setUserName] = useState<string>("");
    const [userEmail, setUserEmail] = useState<string>("");
    const [userAvatar, setUserAvatar] = useState<string>("");
    const [hasUnreadComments, setHasUnreadComments] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [themeMenuOpen, setThemeMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setProfileMenuOpen(false);
                setThemeMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { getCurrentUser, fetchUserAttributes } = await import("aws-amplify/auth");
                const user = await getCurrentUser();
                const attrs = await fetchUserAttributes();
                
                const email = attrs.email || user.signInDetails?.loginId || "";
                setUserEmail(email);
                setUserName(attrs.name || attrs.preferred_username || email.split("@")[0] || "User");
                setUserAvatar(attrs.picture || "");

                const [res, commentsRes] = await Promise.all([
                    fetch("/api/users/me", { headers: { "x-cognito-id": user.userId } }),
                    fetch("/api/comments/recent", { headers: { "x-cognito-id": user.userId } })
                ]);

                if (res.ok) {
                    const data = await res.json();
                    if (data.avatarUrl) setUserAvatar(data.avatarUrl);
                    if (data.name) setUserName(data.name);
                }
                
                if (commentsRes.ok) {
                    const comments = await commentsRes.json();
                    setHasUnreadComments(comments.length > 0);
                }
            } catch { }
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        try {
            const { signOut } = await import("aws-amplify/auth");
            await signOut();
            router.push("/login");
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    useEffect(() => {
        return () => {
            if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
            if (projectsDragTimeoutRef.current) clearTimeout(projectsDragTimeoutRef.current);
            if (hoverProjectTimeoutRef.current) clearTimeout(hoverProjectTimeoutRef.current);
        };
    }, []);

    const handleDragOverSidebar = (e: React.DragEvent) => {
        if (collapsed && setCollapsed) {
            if (!dragTimeoutRef.current) {
                dragTimeoutRef.current = setTimeout(() => {
                    setCollapsed(false);
                    dragTimeoutRef.current = null;
                }, 400);
            }
        }
    };

    const handleDragLeaveSidebar = () => {
        if (dragTimeoutRef.current) {
            clearTimeout(dragTimeoutRef.current);
            dragTimeoutRef.current = null;
        }
    };

    const handleDragOverProjects = (e: React.DragEvent) => {
        if (!projectsOpen) {
            if (!projectsDragTimeoutRef.current) {
                projectsDragTimeoutRef.current = setTimeout(() => {
                    setProjectsOpen(true);
                    projectsDragTimeoutRef.current = null;
                }, 300);
            }
        }
    };

    const handleDragLeaveProjects = () => {
        if (projectsDragTimeoutRef.current) {
            clearTimeout(projectsDragTimeoutRef.current);
            projectsDragTimeoutRef.current = null;
        }
    };
    const [isDraggingSong, setIsDraggingSong] = useState(false);

    useEffect(() => {
        const handleDragStart = () => setIsDraggingSong(true);
        const handleDragEnd = () => setIsDraggingSong(false);

        window.addEventListener("nara-song-drag-start", handleDragStart);
        window.addEventListener("nara-song-drag-end", handleDragEnd);
        window.addEventListener("dragend", handleDragEnd);
        window.addEventListener("drop", handleDragEnd);

        return () => {
            window.removeEventListener("nara-song-drag-start", handleDragStart);
            window.removeEventListener("nara-song-drag-end", handleDragEnd);
            window.removeEventListener("dragend", handleDragEnd);
            window.removeEventListener("drop", handleDragEnd);
        };
    }, []);

    const { projects: allProjects } = useApiProjects();
    const projects = allProjects
        .filter((p) => !p.isDeleted && !p.isShared)
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
    const textVisibilityClass = `whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
        collapsed ? "max-w-0 opacity-0 pointer-events-none" : "max-w-[200px] opacity-100"
    }`;

    // Helper pour le style des lignes actives/inactives
    const linkClass = (isActive: boolean, skipDimming?: boolean) => `
        flex items-center h-9 rounded-lg transition-all relative group text-sm select-none
        ${isActive ? "text-n-accent bg-n-accent/[6%]" : "text-n-text-2 hover:text-n-text hover:bg-n-hover/30"}
        ${collapsed ? "justify-center px-0 w-10 mx-auto" : "px-3 gap-3 w-full"}
        ${isDraggingSong && !skipDimming ? "opacity-35 cursor-no-drop" : ""}
    `;

    return (
        <aside
            onDragOver={handleDragOverSidebar}
            onDragLeave={handleDragLeaveSidebar}
            onDrop={handleDragLeaveSidebar}
            className={`relative flex flex-col h-screen bg-n-bg border-r border-n-border/60 transition-all duration-500 ease-in-out z-50 flex-shrink-0 ${
                collapsed ? "w-[56px]" : "w-[220px]"
            }`}
        >
            {/* TOP PROFILE SECTION */}
            <div ref={profileMenuRef} className={`relative flex items-center h-16 border-b border-n-border/60 shrink-0 transition-all duration-300 ${collapsed ? "justify-center px-0" : "px-4"}`}>
                <div className={`flex items-center w-full transition-all duration-300 ${collapsed ? "justify-center p-1" : "gap-1"}`}>
                    <button 
                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                        className={`flex items-center flex-1 min-w-0 hover:bg-n-hover/40 rounded-xl transition-all duration-300 cursor-pointer ${collapsed ? "p-1" : "p-1.5 -ml-1.5"}`}
                    >
                        <div className="w-9 h-9 rounded-full bg-n-text text-n-bg flex items-center justify-center text-sm font-bold uppercase overflow-hidden shrink-0">
                            {userAvatar ? (
                                <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                userName ? userName[0] : "U"
                            )}
                        </div>
                        {!collapsed && (
                            <div className="flex flex-col flex-1 min-w-0 ml-3 text-left">
                                <span className="text-[14px] font-bold text-n-text truncate">{userName}</span>
                                <span className="text-[12px] text-n-text-2 truncate mt-0.5">Pro Plan</span>
                            </div>
                        )}
                    </button>
                    
                    {!collapsed && (
                        <button className="w-9 h-9 flex items-center justify-center text-n-text-2 hover:text-n-text hover:bg-n-hover/60 rounded-xl transition-colors shrink-0 relative cursor-pointer">
                            <Bell size={18} />
                            {hasUnreadComments && (
                                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-600 rounded-full" />
                            )}
                        </button>
                    )}
                </div>

                {/* Invisible backdrop for clicking outside */}
                {profileMenuOpen && (
                    <div 
                        className="fixed inset-0 z-[90]"
                        onClick={(e) => {
                            e.stopPropagation();
                            setProfileMenuOpen(false);
                            setThemeMenuOpen(false);
                        }}
                    />
                )}

                {/* Dropdown Menu */}
                {profileMenuOpen && (
                    <div className="absolute top-[calc(100%+8px)] left-3 w-[220px] bg-n-surface border border-n-border rounded-xl shadow-2xl z-[100] flex flex-col py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                        
                        {/* Profile Header */}
                        <div className="flex flex-col items-center justify-center p-4 border-b border-n-border/60 mb-1">
                            <Link 
                                href="/settings/profile" 
                                onClick={() => setProfileMenuOpen(false)}
                                className="relative group mb-2 cursor-pointer"
                            >
                                <div className="w-14 h-14 rounded-full bg-n-text text-n-bg flex items-center justify-center text-xl font-bold uppercase overflow-hidden ring-2 ring-transparent group-hover:ring-[var(--accent)] transition-all">
                                    {userAvatar ? (
                                        <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        userName ? userName[0] : "U"
                                    )}
                                </div>
                                <div className="absolute bottom-0 right-0 w-5 h-5 bg-n-hover border-2 border-n-surface rounded-full flex items-center justify-center text-n-text group-hover:bg-n-accent group-hover:text-n-text transition-colors">
                                    <Pencil size={10} />
                                </div>
                            </Link>
                            <span className="text-sm font-bold text-n-text truncate max-w-full">{userName}</span>
                            <span className="text-xs text-n-text-2 truncate max-w-full">{userEmail}</span>
                        </div>

                        {/* Theme with submenu */}
                        <div className="relative group/theme">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setThemeMenuOpen(!themeMenuOpen);
                                }}
                                className="w-full flex items-center justify-between px-3 py-2 text-sm text-n-text hover:text-n-text hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <LayoutTemplate size={15} className="text-n-text-2" />
                                    <span>Theme</span>
                                </div>
                                <ChevronRight size={14} className={`text-n-text-2 transition-transform ${themeMenuOpen ? "rotate-90" : ""}`} />
                            </button>
                            
                            {/* Submenu */}
                            <div className={`absolute left-full top-0 ml-1 w-32 bg-n-surface border border-n-border rounded-xl shadow-2xl z-[101] flex flex-col py-1 transition-all duration-150 ${themeMenuOpen ? "opacity-100 pointer-events-auto translate-x-0" : "opacity-0 pointer-events-none -translate-x-2"}`}>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        document.documentElement.classList.remove("dark");
                                        localStorage.setItem("nara-theme", "light");
                                    }} 
                                    className="w-full flex items-center px-4 py-2 text-sm text-n-text hover:text-n-text hover:bg-white/5 transition-colors text-left cursor-pointer"
                                >
                                    Light
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        document.documentElement.classList.add("dark");
                                        localStorage.setItem("nara-theme", "dark");
                                    }} 
                                    className="w-full flex items-center px-4 py-2 text-sm text-n-text hover:text-n-text hover:bg-white/5 transition-colors text-left cursor-pointer"
                                >
                                    Dark
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                                        document.documentElement.classList.toggle("dark", isSystemDark);
                                        localStorage.removeItem("nara-theme");
                                    }} 
                                    className="w-full flex items-center px-4 py-2 text-sm text-n-text hover:text-n-text hover:bg-white/5 transition-colors text-left cursor-pointer"
                                >
                                    Machine
                                </button>
                            </div>
                        </div>
                        <Link 
                            href="/settings/profile" 
                            onClick={() => setProfileMenuOpen(false)} 
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-n-text hover:text-n-text hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <Settings size={15} className="text-n-text-2" />
                            <span>Settings</span>
                        </Link>
                        
                        <div className="border-t border-n-border/60 my-1 mx-2" />
                        
                        <button 
                            onClick={handleLogout} 
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                            <LogOut size={15} className="text-red-500/70" />
                            <span>Log out</span>
                        </button>
                    </div>
                )}
            </div>
            {/* TOGGLE BUTTON */}
            <button
                onClick={toggleSidebar}
                className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-n-bg border border-n-border-2 text-n-text-2 hover:text-n-text hover:bg-n-hover rounded-full flex items-center justify-center transition-all z-50 shadow-md"
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
                    onClick={async () => {
                        console.log("Sidebar creating song...");
                        try {
                            const { getCurrentUser } = await import("aws-amplify/auth");
                            const user = await getCurrentUser();
                            const res = await fetch("/api/songs/new", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "x-cognito-id": user.userId,
                                },
                                body: JSON.stringify({ title: "Sans titre", projectId: null }),
                            });
                            if (!res.ok) throw new Error("Erreur création");
                            const data = await res.json();
                            router.push(`/write/${data.id}`);
                        } catch (err) {
                            console.error("Create song error:", err);
                        }
                    }}
                    className={`bg-n-cta text-n-cta-text hover:bg-n-cta-hover rounded-lg px-4 py-2 font-semibold transition-colors flex items-center justify-center ${
                        collapsed
                            ? "w-10 px-0 mx-auto"
                            : "w-11/12 mx-auto gap-2"
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

                    <hr className="border-n-border/60 my-1 mx-2 shrink-0" />

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
                            onDragOver={handleDragOverProjects}
                            onDragLeave={handleDragLeaveProjects}
                            className={linkClass(
                                pathname.startsWith("/projects"),
                                true,
                            )}
                        >
                            <FolderOpen size={16} className="flex-shrink-0" />
                            {!collapsed && (
                                <div
                                    className={`flex items-center justify-between flex-1 ${textVisibilityClass}`}
                                >
                                    <span>My Projects</span>
                                    <div
                                        className="p-1 hover:bg-n-hover/50 rounded transition-colors"
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
                            <div className="flex flex-col pl-4 mt-0.5 border-l border-n-border/40 ml-5 gap-0.5">
                                <button
                                    onClick={() => {
                                        window.dispatchEvent(
                                            new CustomEvent(
                                                "open-create-modal",
                                                { detail: { type: "project" } },
                                            ),
                                        );
                                    }}
                                    className="flex items-center w-full h-8 px-2 text-xs text-n-text-2 hover:text-n-text hover:bg-n-hover/40 rounded-md transition-all border border-dashed border-n-border/80 hover:border-n-accent/45 shrink-0 mb-1 group"
                                >
                                    <Plus
                                        size={12}
                                        className="mr-2 text-n-text-2 group-hover:text-n-accent shrink-0 transition-colors"
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
                                                    // Auto-expand project folder on hover delay
                                                    if (!isProjectOpen) {
                                                        if (hoverProjectIdRef.current !== project.id) {
                                                            if (hoverProjectTimeoutRef.current) {
                                                                clearTimeout(hoverProjectTimeoutRef.current);
                                                            }
                                                            hoverProjectIdRef.current = project.id;
                                                            hoverProjectTimeoutRef.current = setTimeout(() => {
                                                                setOpenProjectIds((prev) => ({
                                                                    ...prev,
                                                                    [project.id]: true,
                                                                }));
                                                                hoverProjectTimeoutRef.current = null;
                                                                hoverProjectIdRef.current = null;
                                                            }, 800); // 800ms hover delay
                                                        }
                                                    }
                                                }}
                                                onDragLeave={() => {
                                                    setDragOverProjectId(null);
                                                    if (hoverProjectIdRef.current === project.id) {
                                                        if (hoverProjectTimeoutRef.current) {
                                                            clearTimeout(hoverProjectTimeoutRef.current);
                                                        }
                                                        hoverProjectTimeoutRef.current = null;
                                                        hoverProjectIdRef.current = null;
                                                    }
                                                }}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    setDragOverProjectId(null);
                                                    if (hoverProjectIdRef.current === project.id) {
                                                        if (hoverProjectTimeoutRef.current) {
                                                            clearTimeout(hoverProjectTimeoutRef.current);
                                                        }
                                                        hoverProjectTimeoutRef.current = null;
                                                        hoverProjectIdRef.current = null;
                                                    }
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
                                                        ? "bg-n-accent/25 border border-dashed border-n-accent/60 text-n-text scale-[1.03]"
                                                        : "text-n-text-2 hover:text-n-text hover:bg-n-hover/40 border border-transparent"
                                                }`}
                                            >
                                                <div className="flex items-center min-w-0 pointer-events-none">
                                                    <FolderOpen
                                                        size={12}
                                                        className="mr-2 text-n-text-2 shrink-0"
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
                                                         className="p-1 hover:bg-n-hover/50 rounded transition-colors"
                                                         onClick={(e) => {
                                                             e.stopPropagation();
                                                             toggleProject(
                                                                 project.id,
                                                             );
                                                         }}
                                                     >
                                                         <ChevronDown
                                                             size={12}
                                                             className={`transition-transform duration-200 text-n-text-3 shrink-0 ${isProjectOpen ? "rotate-180" : ""}`}
                                                         />
                                                     </div>
                                                 )}
                                            </button>

                                            {/* Niveau 2 : Sons à l'intérieur du projet */}
                                            {isProjectOpen && (
                                                <div className="flex flex-col pl-4 mt-0.5 border-l border-n-border/60 ml-4 gap-0.5 shrink-0">
                                                    {projectTracks.map(
                                                        (track) => (
                                                            <Link
                                                                key={track.id}
                                                                href={`/write/${track.id}`}
                                                                className="flex items-center h-7 px-2 text-[11px] text-n-text-2 hover:text-n-accent rounded-md transition-colors whitespace-nowrap overflow-hidden text-ellipsis"
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

                    <hr className="border-n-border/60 my-1 mx-2 shrink-0" />

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
            {/* EMPTY BOTTOM SECTION */}
            <div className="h-4 shrink-0"></div>
            


            {/* Warning Confirmation Modal for Drag & Drop */}
            {confirmModal && (
                <div className="fixed inset-0 bg-n-bg/75 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-n-bg border border-n-border rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-n-accent/10 flex items-center justify-center text-n-accent">
                                <Music size={20} />
                            </div>
                            <h3 className="font-serif font-bold text-n-text text-base">
                                Move song?
                            </h3>
                        </div>

                        {/* Body */}
                        <p className="text-n-text-2 text-xs leading-relaxed mb-6">
                            The song{" "}
                            <span className="text-n-text font-semibold">
                                "{confirmModal.songTitle}"
                            </span>{" "}
                            is already in the project{" "}
                            <span className="text-n-text font-semibold">
                                "{confirmModal.currentProjectName}"
                            </span>
                            . Do you want to move it to{" "}
                            <span className="text-n-text font-semibold">
                                "{confirmModal.targetProjectTitle}"
                            </span>
                            ?
                        </p>

                        {/* Actions */}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmModal(null)}
                                className="px-4 py-2 text-xs font-semibold text-n-text-2 hover:text-n-text border border-n-border hover:border-n-border-2 rounded-lg transition-colors cursor-pointer"
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
                                className="bg-n-cta text-n-cta-text hover:bg-n-cta-hover rounded-lg px-4 py-2 font-semibold transition-colors"
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

"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, ChevronDown, LayoutGrid, List, Music } from "lucide-react";
import { useParams } from "next/navigation";
import { useAudioHover } from "@/hooks/useAudioHover";

import coverImage from "@/assets/cover/lgseo.png";
import avatar1 from "@/assets/user/allen.png";
import avatar2 from "@/assets/user/duncan.png";
import avatar3 from "@/assets/user/haslem.png";
import avatar4 from "@/assets/user/mcgrady.png";

const ALL_AVATARS = [avatar1, avatar2, avatar3, avatar4];

export const insideProject = () => {
    const params = useParams();
    const projectId = (params?.id as string) || "Project";
    // Replace underscores with spaces for display
    const displayTitle = projectId.replace(/_/g, " ");

    // État pour gérer la vue actuelle ("grid" ou "list")
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // On affiche les sons mockés uniquement si c'est Let_God_Sort_Em_Out
    const isLGSEO = projectId === "Let_God_Sort_Em_Out";

    const insideProjectList = isLGSEO ? [
        {
            id: "FICO",
            title: "F.I.C.O.",
            time: "Edited 5 minutes ago",
            collabs: 2,
            state: "En écriture",
            lastModified: "just now",
            created: "7 months ago",
            audioSrc: "/audio/lgseo/fico.mp3",
        },
        {
            id: "Let_God_Sort_Em_Out_Chandeliers",
            title: "Let God Sort Em Out/Chandeliers",
            time: "Edited 8 minutes ago",
            collabs: 3,
            state: "Terminé",
            lastModified: "just now",
            created: "7 months ago",
            audioSrc: "/audio/lgseo/lgseo-chandeliers.mp3",
        },
        {
            id: "MTBTTF",
            title: "M.T.B.T.T.F.",
            time: "Edited 12 minutes ago",
            collabs: 2,
            state: "Terminé",
            lastModified: "just now",
            created: "7 months ago",
            audioSrc: "/audio/lgseo/mtbttf.mp3",
        },
        {
            id: "Chains_Whips",
            title: "Chains & Whips",
            time: "Edited 1 hour ago",
            collabs: 4,
            state: "Terminé",
            lastModified: "just now",
            created: "7 months ago",
            audioSrc: "/audio/lgseo/chains-whips.mp3",
        },
        {
            id: "So_Be_It",
            title: "So Be It",
            time: "Edited 2 hours ago",
            collabs: 2,
            state: "En écriture",
            lastModified: "just now",
            created: "7 months ago",
            audioSrc: "/audio/lgseo/so-be-it.mp3",
        },
        {
            id: "POV",
            title: "P.O.V.",
            time: "Edited 3 hours ago",
            collabs: 3,
            state: "En écriture",
            lastModified: "just now",
            created: "7 months ago",
            audioSrc: "/audio/lgseo/pov.mp3",
        },
        {
            id: "Ace_Trumpets",
            title: "Ace Trumpets",
            time: "Edited 1 day ago",
            collabs: 2,
            state: "En écriture",
            lastModified: "just now",
            created: "7 months ago",
            audioSrc: "/audio/lgseo/ace-trumpets.mp3",
        },
        {
            id: "The_Birds_Dont_Sing",
            title: "The Birds Don't Sing",
            time: "Edited 5 minutes ago",
            collabs: 2,
            state: "En écriture",
            lastModified: "just now",
            created: "7 months ago",
            audioSrc: "/audio/lgseo/the-birds-dont-sing.mp3",
        },
        {
            id: "All_Things_Considered",
            title: "All Things Considered",
            time: "Edited 8 minutes ago",
            collabs: 3,
            state: "Terminé",
            lastModified: "just now",
            created: "7 months ago",
            audioSrc: "/audio/lgseo/all-things-considered.mp3",
        },
        {
            id: "Inglorious_Bastards",
            title: "Inglorious Bastards",
            time: "Edited 12 minutes ago",
            collabs: 2,
            state: "Terminé",
            lastModified: "just now",
            created: "7 months ago",
            audioSrc: "/audio/lgseo/inglorious-bastards.mp3",
        },
        {
            id: "So_Far_Ahead",
            title: "So Far Ahead",
            time: "Edited 1 hour ago",
            collabs: 4,
            state: "Terminé",
            lastModified: "just now",
            created: "7 months ago",
            audioSrc: "/audio/lgseo/so-far-ahead.mp3",
        },
        {
            id: "EBIDTA",
            title: "E.B.I.D.T.A.",
            time: "Edited 2 hours ago",
            collabs: 2,
            state: "En écriture",
            lastModified: "just now",
            created: "7 months ago",
            audioSrc: "/audio/lgseo/ebitda.mp3",
        },
        {
            id: "By_The_Grace_Of_God",
            title: "By The Grace Of God",
            time: "Edited 3 hours ago",
            collabs: 3,
            state: "En écriture",
            lastModified: "just now",
            created: "7 months ago",
            audioSrc: "/audio/lgseo/by-the-grace-of-god.mp3",
        },
    ] : [];

    return (
        <div className="w-full font-arimo text-white pb-10">
            {/* TITRE */}
            <h1 className="text-xl font-bold font-syne mb-6">{displayTitle}</h1>

            {/* BARRE DE RECHERCHE */}
            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search size={18} className="text-neutral-400" />
                </div>
                <input
                    type="text"
                    placeholder="Rechercher"
                    className="w-full bg-[#151515] border border-neutral-800/80 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
                />
            </div>

            {/* FILTRES ET VUES */}
            <div className="flex items-center justify-end gap-3 mb-8">
                {/* Dropdown 1 */}
                <button className="flex items-center gap-2 bg-transparent border border-neutral-800 hover:border-neutral-600 transition-colors px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300">
                    All files
                    <ChevronDown size={14} />
                </button>

                {/* Dropdown 2 */}
                <button className="flex items-center gap-2 bg-transparent border border-neutral-800 hover:border-neutral-600 transition-colors px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300">
                    Last viewed
                    <ChevronDown size={14} />
                </button>

                {/* Toggle View */}
                <div className="flex items-center border border-neutral-800 rounded-lg overflow-hidden ml-2">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-neutral-800 text-white" : "bg-transparent text-neutral-500 hover:bg-neutral-800/50"}`}
                    >
                        <LayoutGrid size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-neutral-800 text-white" : "bg-transparent text-neutral-500 hover:bg-neutral-800/50"}`}
                    >
                        <List size={16} />
                    </button>
                </div>
            </div>

            {/* CONDITION D'AFFICHAGE SELON LE VIEWMODE */}
            {insideProjectList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-neutral-500 border border-neutral-800/80 rounded-2xl bg-[#151515] border-dashed">
                    <p>No tracks in this project yet.</p>
                </div>
            ) : viewMode === "grid" ? (
                /* --- VUE GRILLE --- */
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {insideProjectList.map((project, index) => (
                        <ProjectGridItem key={project.id} project={project} index={index} />
                    ))}
                </div>
            ) : (
                /* --- VUE LISTE (TABLEAU) --- */
                <div className="w-full">
                    {/* En-tête du tableau */}
                    <div className="grid grid-cols-12 gap-4 pb-4 mb-2 text-xs font-medium text-neutral-500 border-b border-neutral-800">
                        <div className="col-span-5 pl-2">Name</div>
                        <div className="col-span-2">State</div>
                        <div className="col-span-2">Last modified</div>
                        <div className="col-span-3">Created</div>
                    </div>

                    {/* Lignes du tableau */}
                    <div className="flex flex-col">
                        {insideProjectList.map((project, index) => (
                            <ProjectListItem key={project.id} project={project} isLast={index === insideProjectList.length - 1} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const ProjectGridItem = ({ project, index }: { project: any; index: number }) => {
    const { handlers, isPlaying } = useAudioHover(project.audioSrc, 30);

    return (
        <div
            className="bg-[#151515] border border-neutral-800/80 hover:border-neutral-600 hover:bg-[#1a1a1a] transition-all duration-300 rounded-2xl p-3 flex flex-col sm:flex-row gap-4 cursor-pointer group"
        >
            <div className="w-full aspect-square sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 relative" {...handlers}>
                <Image
                    src={coverImage}
                    alt={project.title}
                    fill
                    className={`object-cover transition-transform duration-500 ${isPlaying ? "scale-105" : "group-hover:scale-105"}`}
                    sizes="(max-width: 640px) 100vw, 128px"
                />
                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? "opacity-100" : "opacity-0"}`}>
                    <div className="w-10 h-10 rounded-full bg-[#D90097] flex items-center justify-center shadow-[0_0_15px_rgba(217,0,151,0.5)]">
                        <Music size={18} className="text-white animate-pulse" />
                    </div>
                </div>
            </div>
            <div className="flex flex-col flex-1 justify-center gap-2 py-1 relative">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-white text-base line-clamp-2 leading-tight pr-2 sm:pr-10 mt-1">
                        {project.title}
                    </h3>
                    <span
                        className={`sm:absolute sm:top-0 sm:right-0 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider flex-shrink-0 h-fit ${
                            project.title === "F.I.C.O."
                                ? "bg-[#D90097]/10 text-[#D90097] border border-[#D90097]/30 font-bold"
                                : "border border-neutral-700 text-neutral-400"
                        }`}
                    >
                        {project.state}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500">
                        {project.time}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-neutral-500 hidden sm:block">
                            Collaborators ({project.collabs})
                        </span>
                        <div className="flex -space-x-2">
                            {[
                                ...Array(
                                    Math.min(project.collabs, 3),
                                ),
                            ].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-6 h-6 rounded-full overflow-hidden relative z-10"
                                >
                                    <Image
                                        src={ALL_AVATARS[(index + i) % ALL_AVATARS.length]}
                                        alt={`Collab ${i + 1}`}
                                        fill
                                        className="object-cover"
                                        sizes="24px"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProjectListItem = ({ project, isLast }: { project: any; isLast: boolean }) => {
    const { handlers, isPlaying } = useAudioHover(project.audioSrc, 30);

    return (
        <div className="flex flex-col">
            <div className="grid grid-cols-12 gap-4 items-center p-2 rounded-xl hover:bg-[#151515] transition-colors cursor-pointer group">
                <div className="col-span-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0" {...handlers}>
                        <Image
                            src={coverImage}
                            alt={project.title}
                            fill
                            className="object-cover"
                            sizes="48px"
                        />
                        {isPlaying && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Music size={14} className="text-[#D90097] animate-pulse" />
                            </div>
                        )}
                    </div>
                    <span className={`font-bold text-sm transition-colors ${isPlaying ? "text-[#D90097]" : "text-white"}`}>
                        {project.title}
                    </span>
                </div>
                <div className="col-span-2 text-xs font-bold">
                    {project.title === "F.I.C.O." ? (
                        <span className="bg-[#D90097]/10 text-[#D90097] border border-[#D90097]/30 px-2 py-0.5 rounded uppercase tracking-wider text-[10px] inline-block">
                            {project.state}
                        </span>
                    ) : (
                        <span className="text-white">
                            {project.state}
                        </span>
                    )}
                </div>
                <div className="col-span-2 text-xs text-neutral-400">
                    {project.lastModified}
                </div>
                <div className="col-span-3 text-xs text-neutral-400">
                    {project.created}
                </div>
            </div>
            {!isLast && (
                <div className="border-b border-neutral-800 mx-2 my-1"></div>
            )}
        </div>
    );
};

"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, ChevronDown, LayoutGrid, List, Music } from "lucide-react";
import { useAudioHover } from "@/hooks/useAudioHover";

import vince from "@/assets/cover/vince.png";
import testCover from "@/assets/cover/test.jpg";
import timekillers from "@/assets/cover/timekillers.jpg";
import untitled from "@/assets/cover/untitled.jpg";
import breathe from "@/assets/cover/breathe.jpg";
import lioaf from "@/assets/cover/lioaf.jpg";
import wideopen from "@/assets/cover/wideopen.jpg";
import avatar1 from "@/assets/user/allen.png";
import avatar2 from "@/assets/user/duncan.png";
import avatar3 from "@/assets/user/haslem.png";
import avatar4 from "@/assets/user/mcgrady.png";

const ALL_AVATARS = [avatar1, avatar2, avatar3, avatar4];

export const Drafts = () => {
    // État pour gérer la vue actuelle ("grid" ou "list")
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const draftsList = [
        {
            id: "MHM",
            title: "MHM",
            time: "Edited 5 minutes ago",
            collabs: 2,
            state: "En écriture",
            lastModified: "just now",
            created: "7 months ago",
            image: vince,
            audioSrc: "/audio/drafts/mhm.mp3",
        },
        {
            id: "test",
            title: "test",
            time: "Edited 8 minutes ago",
            collabs: 3,
            state: "Terminé",
            lastModified: "just now",
            created: "7 months ago",
            image: testCover,
            audioSrc: "/audio/drafts/test.mp3",
        },
        {
            id: "Time_killers",
            title: "Time killers",
            time: "Edited 12 minutes ago",
            collabs: 2,
            state: "Terminé",
            lastModified: "just now",
            created: "7 months ago",
            image: timekillers,
            audioSrc: "/audio/drafts/time-killers.mp3",
        },
        {
            id: "untitled_01",
            title: "untitled 01",
            time: "Edited 1 hour ago",
            collabs: 4,
            state: "Terminé",
            lastModified: "just now",
            created: "7 months ago",
            image: untitled,
            audioSrc: "/audio/drafts/untitled.mp3",
        },
        {
            id: "breathe",
            title: "breathe",
            time: "Edited 2 hours ago",
            collabs: 2,
            state: "En écriture",
            lastModified: "just now",
            created: "7 months ago",
            image: breathe,
            audioSrc: "/audio/drafts/breathe.mp3",
        },
        {
            id: "Love_Is_Only_A_Feeling",
            title: "Love Is Only A Feeling",
            time: "Edited 3 hours ago",
            collabs: 3,
            state: "En écriture",
            lastModified: "just now",
            created: "7 months ago",
            image: lioaf,
            audioSrc: "/audio/drafts/lioaf.mp3",
        },
        {
            id: "WIDE_Open",
            title: "WIDE Open",
            time: "Edited 1 day ago",
            collabs: 2,
            state: "En écriture",
            lastModified: "just now",
            created: "7 months ago",
            image: wideopen,
            audioSrc: "/audio/drafts/wide-open.mp3",
        },
    ];

    return (
        <div className="w-full font-arimo text-white pb-10">
            {/* TITRE */}
            <h1 className="text-xl font-bold font-syne mb-6">All drafts</h1>

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
            {viewMode === "grid" ? (
                /* --- VUE GRILLE --- */
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {draftsList.map((draft, index) => (
                        <DraftGridItem key={draft.id} draft={draft} index={index} />
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
                        {draftsList.map((draft, index) => (
                            <DraftListItem key={draft.id} draft={draft} isLast={index === draftsList.length - 1} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Sous-composants pour gérer les hooks individuellement ---

const DraftGridItem = ({ draft, index }: { draft: any; index: number }) => {
    const { handlers, isPlaying } = useAudioHover(draft.audioSrc, 30);

    return (
        <div
            className="bg-[#151515] border border-neutral-800/80 hover:border-neutral-600 hover:bg-[#1a1a1a] transition-all duration-300 rounded-2xl p-3 flex flex-col sm:flex-row gap-4 cursor-pointer group"
        >
            <div className="w-full aspect-square sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 relative" {...handlers}>
                <Image
                    src={draft.image}
                    alt={draft.title}
                    fill
                    className={`object-cover transition-transform duration-500 ${isPlaying ? "scale-105" : "group-hover:scale-105"}`}
                    sizes="(max-width: 640px) 100vw, 128px"
                />
                {/* Overlay pour l'indicateur audio */}
                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? "opacity-100" : "opacity-0"}`}>
                    <div className="w-10 h-10 rounded-full bg-[#D90097] flex items-center justify-center shadow-[0_0_15px_rgba(217,0,151,0.5)]">
                        <Music size={18} className="text-white animate-pulse" />
                    </div>
                </div>
            </div>
            <div className="flex flex-col flex-1 justify-center gap-2 py-1 relative">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-white text-base line-clamp-2 leading-tight pr-2 sm:pr-10 mt-1">
                        {draft.title}
                    </h3>
                    <span className="sm:absolute sm:top-0 sm:right-0 border border-neutral-700 text-neutral-400 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider flex-shrink-0 h-fit">
                        {draft.state}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500">
                        {draft.time}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-neutral-500 hidden sm:block">
                            Collaborators ({draft.collabs})
                        </span>
                        <div className="flex -space-x-2">
                            {[...Array(Math.min(draft.collabs, 3))].map((_, i) => (
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

const DraftListItem = ({ draft, isLast }: { draft: any; isLast: boolean }) => {
    const { handlers, isPlaying } = useAudioHover(draft.audioSrc, 30);

    return (
        <div className="flex flex-col">
            <div className="grid grid-cols-12 gap-4 items-center p-2 rounded-xl hover:bg-[#151515] transition-colors cursor-pointer group">
                {/* Name + Image */}
                <div className="col-span-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0" {...handlers}>
                        <Image
                            src={draft.image}
                            alt={draft.title}
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
                        {draft.title}
                    </span>
                </div>

                {/* State */}
                <div className="col-span-2 text-xs font-bold text-white">
                    {draft.state}
                </div>

                {/* Last modified */}
                <div className="col-span-2 text-xs text-neutral-400">
                    {draft.lastModified}
                </div>

                {/* Created */}
                <div className="col-span-3 text-xs text-neutral-400">
                    {draft.created}
                </div>
            </div>
            {!isLast && (
                <div className="border-b border-neutral-800 mx-2 my-1"></div>
            )}
        </div>
    );
};

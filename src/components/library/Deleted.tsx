"use client";

import { useState } from "react";
import Image from "next/image";
import {
    Search,
    ChevronDown,
    LayoutGrid,
    List,
    RotateCcw,
    Trash2,
    Music,
} from "lucide-react";
import { useAudioHover } from "@/hooks/useAudioHover";

import intoYou from "@/assets/cover/intoyou.png";
import rightInTheMiddle from "@/assets/cover/rightinthemiddle.png";

export const Deleted = () => {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const deletedList = [
        {
            id: "So Into You",
            title: "So Into You",
            album: "Tamia",
            time: "Deleted 16 days ago",
            image: intoYou,
            audioSrc: "/audio/other/into-you.mp3",
        },
        {
            id: "Right in the Middle",
            title: "Right in the Middle",
            album: "Dance With My Father",
            time: "Deleted 3 weeks ago",
            image: rightInTheMiddle,
            audioSrc: "/audio/other/right-in-the-middle.mp3",
        },
    ];

    return (
        <div className="w-full font-arimo text-white pb-10">
            <h1 className="text-xl font-bold font-syne mb-6">Deleted files</h1>

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

            <div className="flex items-center justify-end gap-3 mb-8">
                <button className="flex items-center gap-2 bg-transparent border border-neutral-800 hover:border-neutral-600 transition-colors px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300">
                    All deleted items
                    <ChevronDown size={14} />
                </button>
                <button className="flex items-center gap-2 bg-transparent border border-neutral-800 hover:border-neutral-600 transition-colors px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300">
                    Last deleted
                    <ChevronDown size={14} />
                </button>

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

            {viewMode === "grid" ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {deletedList.map((file) => (
                        <DeletedGridItem key={file.id} file={file} />
                    ))}
                </div>
            ) : (
                <div className="w-full">
                    <div className="grid grid-cols-12 gap-4 pb-4 mb-2 text-xs font-medium text-neutral-500 border-b border-neutral-800">
                        <div className="col-span-5 pl-2">Name</div>
                        <div className="col-span-4">Deleted time</div>
                        <div className="col-span-3 text-right pr-2">
                            Actions
                        </div>
                    </div>

                    <div className="flex flex-col">
                        {deletedList.map((file, index) => (
                            <DeletedListItem
                                key={file.id}
                                file={file}
                                isLast={index === deletedList.length - 1}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const DeletedGridItem = ({ file }: { file: any }) => {
    const { handlers, isPlaying } = useAudioHover(file.audioSrc || "", 30);

    return (
        <div
            className="bg-[#151515] border border-neutral-800/80 hover:border-neutral-600 hover:bg-[#1a1a1a] transition-all duration-300 rounded-2xl p-3 flex flex-col sm:flex-row gap-4 cursor-pointer group"
        >
            <div className="w-full aspect-square sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 relative" {...handlers}>
                <Image
                    src={file.image}
                    alt={file.title}
                    fill
                    className={`object-cover transition-transform duration-500 ${isPlaying ? "scale-105 opacity-100" : "opacity-60 group-hover:scale-105 group-hover:opacity-100"}`}
                    sizes="(max-width: 640px) 100vw, 128px"
                />
                {file.audioSrc && (
                    <div
                        className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? "opacity-100" : "opacity-0"}`}
                    >
                        <div className="w-10 h-10 rounded-full bg-[#D90097] flex items-center justify-center shadow-[0_0_15px_rgba(217,0,151,0.5)]">
                            <Music
                                size={18}
                                className="text-white animate-pulse"
                            />
                        </div>
                    </div>
                )}
            </div>
            <div className="flex flex-col flex-1 justify-between py-1 relative">
                <div>
                    <h3
                        className={`font-bold text-base line-clamp-2 leading-tight mt-1 transition-colors ${isPlaying ? "text-white" : "text-neutral-400 group-hover:text-white"}`}
                    >
                        {file.title}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                        {file.album}
                    </p>
                </div>
                <div className="flex items-center justify-between mt-3 sm:mt-4">
                    <span className="text-[10px] text-neutral-500">
                        {file.time}
                    </span>
                    <div className="flex gap-2 relative z-20">
                        <button
                            className="p-1 text-neutral-400 hover:text-[#D90097] hover:bg-[#D90097]/10 rounded transition-colors"
                            title="Restaurer"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <RotateCcw size={16} />
                        </button>
                        <button
                            className="p-1 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                            title="Supprimer définitivement"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DeletedListItem = ({ file, isLast }: { file: any; isLast: boolean }) => {
    const { handlers, isPlaying } = useAudioHover(file.audioSrc || "", 30);

    return (
        <div className="flex flex-col">
            <div className="grid grid-cols-12 gap-4 items-center p-2 rounded-xl hover:bg-[#151515] transition-colors cursor-pointer group">
                <div className="col-span-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0" {...handlers}>
                        <Image
                            src={file.image}
                            alt={file.title}
                            fill
                            className={`object-cover transition-opacity duration-300 ${isPlaying ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`}
                            sizes="48px"
                        />
                        {isPlaying && file.audioSrc && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Music
                                    size={14}
                                    className="text-[#D90097] animate-pulse"
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span
                            className={`font-bold text-sm transition-colors ${isPlaying ? "text-[#D90097]" : "text-neutral-400 group-hover:text-white"}`}
                        >
                            {file.title}
                        </span>
                        <span className="text-xs text-neutral-500">
                            {file.album}
                        </span>
                    </div>
                </div>

                <div className="col-span-4 text-xs text-neutral-400">
                    {file.time}
                </div>

                <div className="col-span-3 flex justify-end gap-2 pr-2 relative z-20">
                    <button
                        className="p-1.5 text-neutral-400 hover:text-[#D90097] hover:bg-[#D90097]/10 rounded transition-colors"
                        title="Restaurer"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <RotateCcw size={16} />
                    </button>
                    <button
                        className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                        title="Supprimer définitivement"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
            {!isLast && (
                <div className="border-b border-neutral-800 mx-2 my-1"></div>
            )}
        </div>
    );
};

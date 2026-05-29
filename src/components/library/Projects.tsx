"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ChevronDown, LayoutGrid, List } from "lucide-react";

import lgseo from "@/assets/cover/lgseo.png";
import america from "@/assets/cover/america.jpg";
import mrclean from "@/assets/cover/mrclean.jpg";
import aquemini from "@/assets/cover/aquemini.jpg";
import infamous from "@/assets/cover/infamous.jpg";
import alfredo from "@/assets/cover/alfredo.png";
import microphone from "@/assets/cover/microphone.jpg";
import whocoppin from "@/assets/cover/whocoppin.jpg";
import avisProfil from "@/assets/user/haslem.png";

export const Projects = () => {
    // État pour gérer la vue actuelle ("grid" ou "list")
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Données factices basées sur ton image et le besoin de la vue liste
    const insideProjectList = [
        {
            id: "Let_God_Sort_Em_Out",
            title: "Let God Sort Em Out",
            type: "Album",
            songsCount: 13,
            collabs: 3,
            state: "En cours",
            lastModified: "just now",
            created: "6 days ago",
            image: lgseo,
        },
        {
            id: "This_Is_America",
            title: "This Is America",
            type: "Single",
            songsCount: 1,
            collabs: 0,
            state: "Terminé",
            lastModified: "just now",
            created: "6 days ago",
            image: america,
        },
        {
            id: "Mr_Clean_Modern_Day_Mugging",
            title: "Mr. Clean / Modern Day Mugging",
            type: "EP",
            songsCount: 6,
            collabs: 3,
            state: "En cours",
            lastModified: "just now",
            created: "6 days ago",
            image: mrclean,
        },
        {
            id: "Aquemini",
            title: "Aquemini",
            type: "Album",
            songsCount: 16,
            collabs: 3,
            state: "Terminé",
            lastModified: "just now",
            created: "6 days ago",
            image: aquemini,
        },
        {
            id: "The_Infamous",
            title: "The Infamous",
            type: "Album",
            songsCount: 16,
            collabs: 0,
            state: "En cours",
            lastModified: "just now",
            created: "6 days ago",
            image: infamous,
        },
        {
            id: "Alfredo_2",
            title: "Alfredo 2",
            type: "Album",
            songsCount: 14,
            collabs: 0,
            state: "En cours",
            lastModified: "just now",
            created: "6 days ago",
            image: alfredo,
        },
        {
            id: "Microphone_Champion",
            title: "Microphone Champion",
            type: "Album",
            songsCount: 17,
            collabs: 0,
            state: "En cours",
            lastModified: "just now",
            created: "6 days ago",
            image: microphone,
        },
        {
            id: "Who_Coppin'",
            title: "Who Coppin'",
            type: "Single",
            songsCount: 1,
            collabs: 0,
            state: "Terminé",
            lastModified: "just now",
            created: "6 days ago",
            image: whocoppin,
        },
    ];

    return (
        <div className="w-full font-arimo text-white pb-10">
            {/* TITRE */}
            <h1 className="text-xl font-bold font-syne mb-6">My Projects</h1>

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

            {/* ONGLETS ET FILTRES */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                {/* Onglets (Tabs) */}
                <div className="flex items-center gap-1">
                    <button className="bg-neutral-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors">
                        All projects
                    </button>
                    <button className="bg-transparent text-neutral-500 hover:text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors">
                        Shared folders
                    </button>
                </div>

                {/* Filtres de droite */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0">
                    <button className="flex items-center gap-2 bg-transparent border border-neutral-800 hover:border-neutral-600 transition-colors px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 whitespace-nowrap">
                        All organizations
                        <ChevronDown size={14} />
                    </button>

                    <button className="flex items-center gap-2 bg-transparent border border-neutral-800 hover:border-neutral-600 transition-colors px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 whitespace-nowrap">
                        All folders
                        <ChevronDown size={14} />
                    </button>

                    <button className="flex items-center gap-2 bg-transparent border border-neutral-800 hover:border-neutral-600 transition-colors px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 whitespace-nowrap">
                        Last viewed
                        <ChevronDown size={14} />
                    </button>

                    {/* Toggle View (Grille / Liste) */}
                    <div className="flex items-center border border-neutral-800 rounded-lg overflow-hidden shrink-0 ml-2">
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
            </div>

            {/* CONDITION D'AFFICHAGE SELON LE VIEWMODE */}
            {viewMode === "grid" ? (
                /* --- VUE GRILLE --- */
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {insideProjectList.map((project) => (
                        <Link
                            key={project.id}
                            href={`/projects/${project.id}`}
                            className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer border border-neutral-800/80 hover:border-neutral-500 transition-colors"
                        >
                            {/* Image de fond (Prend tout le bloc) */}
                            <Image
                                src={project.image}
                                alt={project.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />

                            {/* Dégradé sombre pour lire le texte */}
                            <div className="absolute inset-0 bg-[#111111]/40 group-hover:bg-[#111111]/60 transition-colors"></div>

                            {/* Contenu textuel en bas */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-xs font-bold text-neutral-300 tracking-wide">
                                        {project.type} • {project.songsCount}{" "}
                                        {project.songsCount > 1
                                            ? "songs"
                                            : "song"}
                                    </span>
                                    <span className="text-[10px] text-neutral-500">
                                        Created {project.created}
                                    </span>
                                </div>

                                <h3 className="font-bold text-white text-lg line-clamp-1">
                                    {project.title}
                                </h3>

                                {/* Section Collaborateurs (affichée seulement s'il y en a) */}
                                {project.collabs > 0 ? (
                                    <div className="flex items-center justify-end gap-2 mt-2">
                                        <span className="text-[10px] text-neutral-500 hidden sm:block">
                                            Collaborators ({project.collabs})
                                        </span>
                                        <div className="flex -space-x-2">
                                            {[
                                                ...Array(
                                                    Math.min(
                                                        project.collabs,
                                                        3,
                                                    ),
                                                ),
                                            ].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="w-6 h-6 rounded-full border-2 border-[#111] overflow-hidden relative z-10"
                                                >
                                                    <Image
                                                        src={avisProfil}
                                                        alt="Collab"
                                                        fill
                                                        className="object-cover"
                                                        sizes="24px"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    // Diviseur invisible pour garder la même hauteur si pas de collabs
                                    <div className="h-8 mt-2"></div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                /* --- VUE LISTE (Ton code exact avec les props adaptées) --- */
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
                            <div key={project.id} className="flex flex-col">
                                <Link
                                    href={`/projects/${project.id}`}
                                    className="grid grid-cols-12 gap-4 items-center p-2 rounded-xl hover:bg-[#151515] transition-colors cursor-pointer"
                                >
                                    {/* Name + Image */}
                                    <div className="col-span-5 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0">
                                            <Image
                                                src={project.image}
                                                alt={project.title}
                                                fill
                                                className="object-cover"
                                                sizes="48px"
                                            />
                                        </div>
                                        <span className="font-bold text-sm text-white">
                                            {project.title}
                                        </span>
                                    </div>

                                    {/* State */}
                                    <div className="col-span-2 text-xs font-bold text-white">
                                        {project.state}
                                    </div>

                                    {/* Last modified */}
                                    <div className="col-span-2 text-xs text-white">
                                        {project.lastModified}
                                    </div>

                                    {/* Created */}
                                    <div className="col-span-3 text-xs text-white">
                                        {project.created}
                                    </div>
                                </Link>
                                {index !== insideProjectList.length - 1 && (
                                    <div className="border-b border-neutral-800 mx-2 my-1"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

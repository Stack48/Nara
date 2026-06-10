"use client";

import { useState, useEffect, useRef } from "react";
import { X, Upload, Plus, Users, Edit3, FolderOpen } from "lucide-react";
import Image from "next/image";
import { useSongs, updateSongDetails } from "@/lib/songStore";
import { useProjects, updateProjectDetails, createProject } from "@/lib/projectStore";

// Cover images imports
import vince from "@/assets/cover/vince.png";
import testCover from "@/assets/cover/test.jpg";
import timekillers from "@/assets/cover/timekillers.jpg";
import untitled from "@/assets/cover/untitled.jpg";
import breathe from "@/assets/cover/breathe.jpg";
import lioaf from "@/assets/cover/lioaf.jpg";
import wideopen from "@/assets/cover/wideopen.jpg";
import lgseo from "@/assets/cover/lgseo.png";
import intoYou from "@/assets/cover/intoyou.png";
import rightInTheMiddle from "@/assets/cover/rightinthemiddle.png";
import alfredo from "@/assets/cover/alfredo.png";
import ghettodreams from "@/assets/cover/ghettodreams.png";
import america from "@/assets/cover/america.jpg";
import mrclean from "@/assets/cover/mrclean.jpg";
import aquemini from "@/assets/cover/aquemini.jpg";
import infamous from "@/assets/cover/infamous.jpg";
import microphone from "@/assets/cover/microphone.jpg";
import whocoppin from "@/assets/cover/whocoppin.jpg";

// Suggested Nara users for easy collaborator adding
const NARA_SUGGESTED_USERS = [
    "Ray Allen",
    "Tim Duncan",
    "Udonis Haslem",
    "Tracy McGrady",
    "Kobe Bryant",
    "Allen Iverson",
];

const PRESET_COVERS = [
    { key: "vince", image: vince },
    { key: "test", image: testCover },
    { key: "timekillers", image: timekillers },
    { key: "untitled", image: untitled },
    { key: "breathe", image: breathe },
    { key: "lioaf", image: lioaf },
    { key: "wideopen", image: wideopen },
    { key: "lgseo", image: lgseo },
    { key: "intoyou", image: intoYou },
    { key: "rightinthemiddle", image: rightInTheMiddle },
    { key: "alfredo", image: alfredo },
    { key: "ghettodreams", image: ghettodreams },
    { key: "america", image: america },
    { key: "mrclean", image: mrclean },
    { key: "aquemini", image: aquemini },
    { key: "infamous", image: infamous },
    { key: "microphone", image: microphone },
    { key: "whocoppin", image: whocoppin },
];

interface EditDetailsModalProps {
    isOpen: boolean;
    type: "song" | "project";
    itemId?: string;
    isCreate?: boolean;
    onClose: () => void;
}

export const EditDetailsModal = ({
    isOpen,
    type,
    itemId,
    isCreate = false,
    onClose,
}: EditDetailsModalProps) => {
    const songs = useSongs();
    const projects = useProjects();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form states
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [state, setState] = useState("");
    const [collaboratorsList, setCollaboratorsList] = useState<string[]>([]);
    const [newCollab, setNewCollab] = useState("");
    const [image, setImage] = useState<any>(null);
    const [projectType, setProjectType] = useState<"Album" | "EP" | "Single">("Album");

    // Resolve current item details
    useEffect(() => {
        if (!isOpen) return;

        if (isCreate) {
            setTitle("");
            setDescription("");
            setState("");
            setCollaboratorsList([]);
            setImage(null);
            setProjectType("Album");
            return;
        }

        if (!itemId) return;

        if (type === "song") {
            const song = songs.find((s) => s.id === itemId);
            if (song) {
                setTitle(song.title || "");
                setDescription(song.description || "");
                setState(song.state || "En écriture");
                setCollaboratorsList(song.collaboratorsList || []);
                setImage(song.image || null);
            }
        } else {
            const project = projects.find((p) => p.id === itemId);
            if (project) {
                setTitle(project.title || "");
                setDescription(project.description || "");
                setState(project.state || "En cours");
                setCollaboratorsList(project.collaboratorsList || []);
                setImage(project.image || null);
                setProjectType((project.type as any) || "Album");
            }
        }
    }, [isOpen, itemId, type, isCreate, songs, projects]);

    if (!isOpen) return null;

    const handlePresetSelect = (presetImg: any) => {
        setImage(presetImg);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const getImportedImages = () => {
        const uniqueImages: any[] = [];
        const seen = new Set<string>();

        songs.forEach((s) => {
            if (s.image) {
                const srcStr = typeof s.image === "object" ? s.image.src : s.image;
                if (srcStr && !seen.has(srcStr)) {
                    seen.add(srcStr);
                    uniqueImages.push(s.image);
                }
            }
        });

        projects.forEach((p) => {
            if (p.image) {
                const srcStr = typeof p.image === "object" ? p.image.src : p.image;
                if (srcStr && !seen.has(srcStr)) {
                    seen.add(srcStr);
                    uniqueImages.push(p.image);
                }
            }
        });

        if (uniqueImages.length === 0) {
            PRESET_COVERS.forEach((preset) => {
                const srcStr = typeof preset.image === "object" ? preset.image.src : preset.image;
                if (srcStr && !seen.has(srcStr)) {
                    seen.add(srcStr);
                    uniqueImages.push(preset.image);
                }
            });
        }

        return uniqueImages;
    };

    const isImageSelected = (img: any) => {
        if (!image || !img) return false;
        const currentSrc = typeof image === "object" ? image.src : image;
        const targetSrc = typeof img === "object" ? img.src : img;
        return currentSrc === targetSrc;
    };

    const handleAddCollaborator = (nameToAdd?: string) => {
        const name = nameToAdd || newCollab.trim();
        if (name && !collaboratorsList.includes(name)) {
            setCollaboratorsList([...collaboratorsList, name]);
            if (!nameToAdd) setNewCollab("");
        }
    };

    const handleRemoveCollaborator = (name: string) => {
        setCollaboratorsList(collaboratorsList.filter((c) => c !== name));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        const details: any = {
            title: title.trim(),
            description: description.trim(),
            image,
            collaboratorsList,
        };

        if (isCreate) {
            if (type === "project") {
                createProject(title.trim(), projectType);
                const newProjectId = title.trim().replace(/\s+/g, "_");
                updateProjectDetails(newProjectId, details);
                window.dispatchEvent(
                    new CustomEvent("show-nara-toast", {
                        detail: { message: `Project "${title.trim()}" created successfully!` },
                    }),
                );
            }
        } else {
            if (type === "song") {
                details.state = state;
                updateSongDetails(itemId!, details);
                window.dispatchEvent(
                    new CustomEvent("show-nara-toast", {
                        detail: { message: `Song "${details.title}" updated successfully!` },
                    }),
                );
            } else {
                details.type = projectType;
                updateProjectDetails(itemId!, details);
                window.dispatchEvent(
                    new CustomEvent("show-nara-toast", {
                        detail: { message: `Project "${details.title}" updated successfully!` },
                    }),
                );
            }
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <div className="bg-[#121212] border border-neutral-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-900 bg-neutral-950/20 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#D90097]/10 flex items-center justify-center text-[#D90097]">
                            <Edit3 size={18} />
                        </div>
                        <div>
                            <h3 className="font-syne font-bold text-white text-base">
                                {isCreate ? "Create Project Details" : `Edit ${type === "song" ? "Song" : "Project"} Details`}
                            </h3>
                            <p className="text-xs text-neutral-400 font-medium mt-0.5">
                                {title || "Untitled"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-neutral-500 hover:text-white p-1.5 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form scroll container */}
                <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Cover Image + Title & Meta */}
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Cover Image selector */}
                        <div className="flex flex-col items-center gap-2.5 shrink-0">
                            <label className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider self-start">
                                Cover Art
                            </label>
                            <div className="relative w-36 h-36 rounded-2xl border border-neutral-800 overflow-hidden bg-neutral-900 flex items-center justify-center group shadow-md">
                                {image ? (
                                    <Image
                                        src={image}
                                        alt="Selected cover"
                                        fill
                                        className="object-cover"
                                        unoptimized={typeof image === "string" && image.startsWith("data:")}
                                    />
                                ) : type === "project" ? (
                                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-[#181818] to-neutral-950 flex items-center justify-center">
                                        <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-neutral-800/10 border border-neutral-800/30 group-hover:border-[#D90097]/20 group-hover:bg-[#D90097]/5 transition-all duration-500">
                                            <FolderOpen
                                                size={28}
                                                className="text-neutral-500 group-hover:text-[#D90097] transition-all duration-500"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-neutral-600 text-xs">No Cover</div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs gap-1.5 transition-opacity duration-200 cursor-pointer"
                                >
                                    <Upload size={18} />
                                    <span>Upload Image</span>
                                </button>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </div>

                        {/* Title & Description & Status */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                                    Name / Title
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={type === "song" ? "Enter song title" : "Enter project name"}
                                    className="w-full bg-[#151515] border border-neutral-800 focus:border-neutral-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none transition-colors"
                                />
                            </div>

                            {type === "song" && (
                                <div>
                                    <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                                        Status / State
                                    </label>
                                    <select
                                        value={state}
                                        onChange={(e) => setState(e.target.value)}
                                        className="w-full bg-[#151515] border border-neutral-800 focus:border-neutral-700 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-colors cursor-pointer"
                                    >
                                        <option value="En écriture">En écriture</option>
                                        <option value="En cours">En cours</option>
                                        <option value="Mixage">Mixage</option>
                                        <option value="Mastering">Mastering</option>
                                        <option value="Terminé">Terminé</option>
                                    </select>
                                </div>
                            )}

                            {type === "project" && (
                                <div>
                                    <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                                        Project Type
                                    </label>
                                    <select
                                        value={projectType}
                                        onChange={(e) => setProjectType(e.target.value as any)}
                                        className="w-full bg-[#151515] border border-neutral-800 focus:border-neutral-700 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none transition-colors cursor-pointer"
                                    >
                                        <option value="Album">Album</option>
                                        <option value="EP">EP</option>
                                        <option value="Single">Single</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dynamic cover images select row */}
                    <div className="space-y-2">
                        <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
                            Existing Images
                        </label>
                        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-neutral-800">
                            {getImportedImages().map((img, index) => {
                                const isSelected = isImageSelected(img);
                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handlePresetSelect(img)}
                                        className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-200 hover:scale-105 cursor-pointer ${
                                            isSelected
                                                ? "border-[#D90097] scale-105 shadow-md shadow-[#D90097]/25"
                                                : "border-neutral-800 hover:border-neutral-600"
                                        }`}
                                    >
                                        <Image
                                            src={img}
                                            alt={`Dynamic Image ${index}`}
                                            fill
                                            className="object-cover"
                                            sizes="64px"
                                            unoptimized={typeof img === "string" && img.startsWith("data:")}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Description textarea */}
                    <div>
                        <label className="block text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a detailed description here..."
                            rows={3}
                            className="w-full bg-[#151515] border border-neutral-800 focus:border-neutral-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none transition-colors resize-none"
                        />
                    </div>

                    {/* Collaborators chips list */}
                    <div className="space-y-4">
                        <div>
                            <label className="flex items-center gap-1.5 text-neutral-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                                <Users size={12} />
                                <span>Collaborators ({collaboratorsList.length})</span>
                            </label>

                            {/* Collaborator chips */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                {collaboratorsList.map((collab) => (
                                    <div
                                        key={collab}
                                        className="flex items-center gap-1.5 bg-[#1a1a1a] border border-neutral-800 rounded-full py-1 px-3 text-xs text-white"
                                    >
                                        <span>{collab}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCollaborator(collab)}
                                            className="text-neutral-500 hover:text-red-400 p-0.5 transition-colors cursor-pointer"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                {collaboratorsList.length === 0 && (
                                    <span className="text-xs text-neutral-600 italic">
                                        No collaborators added yet
                                    </span>
                                )}
                            </div>

                            {/* Collaborator Input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newCollab}
                                    onChange={(e) => setNewCollab(e.target.value)}
                                    placeholder="Add collaborator name..."
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddCollaborator();
                                        }
                                    }}
                                    className="flex-1 bg-[#151515] border border-neutral-800 focus:border-neutral-700 rounded-xl py-2 px-4 text-xs text-white focus:outline-none transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleAddCollaborator()}
                                    className="bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl p-2 transition-colors cursor-pointer flex items-center justify-center shrink-0 w-9 h-9"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Suggestions */}
                        <div className="space-y-2">
                            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                                Suggestions
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {NARA_SUGGESTED_USERS.filter((user) => !collaboratorsList.includes(user)).map(
                                    (user) => (
                                        <button
                                            key={user}
                                            type="button"
                                            onClick={() => handleAddCollaborator(user)}
                                            className="text-[11px] font-semibold text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg py-1 px-2.5 transition-all flex items-center gap-1 cursor-pointer hover:bg-neutral-800"
                                        >
                                            <Plus size={10} />
                                            <span>{user}</span>
                                        </button>
                                    ),
                                )}
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-neutral-900 bg-neutral-950/20 shrink-0 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700 rounded-lg transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!title.trim()}
                        className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#AB0063] to-[#D50093] disabled:opacity-50 disabled:pointer-events-none rounded-lg shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all cursor-pointer"
                    >
                        {isCreate ? "Create Project" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
};

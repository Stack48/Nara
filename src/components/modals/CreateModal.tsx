"use client";

import { useState } from "react";
import { X, UploadCloud, Users, Music, FolderOpen } from "lucide-react";
import { createSong } from "@/lib/songStore";
import { createProject } from "@/lib/projectStore";

interface CreateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateModal = ({ isOpen, onClose }: CreateModalProps) => {
    const [type, setType] = useState<"song" | "project">("song");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [showDescription, setShowDescription] = useState(false);
    const [collaborators, setCollaborators] = useState("");
    const [selectedPresetCover, setSelectedPresetCover] = useState<number | null>(null);

    const handleCreate = () => {
        if (!title.trim()) return;

        if (type === "song") {
            createSong(title.trim());
            window.dispatchEvent(new CustomEvent("show-nara-toast", {
                detail: { message: `Song "${title.trim()}" created successfully!` }
            }));
        } else {
            createProject(title.trim(), "Album");
            window.dispatchEvent(new CustomEvent("show-nara-toast", {
                detail: { message: `Project "${title.trim()}" created successfully!` }
            }));
        }
        
        // Reset states
        setTitle("");
        setDescription("");
        setCollaborators("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center font-arimo">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-[#151515] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
                    <h2 className="text-xl font-bold font-syne text-white">
                        Create New Creation
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {/* Type Toggle & Creative Description */}
                    <div className="flex flex-col gap-2">
                        <div className="flex p-1 bg-black rounded-xl border border-neutral-800">
                            <button
                                onClick={() => setType("song")}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                                    type === "song"
                                        ? "bg-[#202020] text-white shadow-sm"
                                        : "text-neutral-500 hover:text-neutral-300"
                                }`}
                            >
                                <Music size={16} />
                                Song
                            </button>
                            <button
                                onClick={() => setType("project")}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                                    type === "project"
                                        ? "bg-[#202020] text-white shadow-sm"
                                        : "text-neutral-500 hover:text-neutral-300"
                                }`}
                            >
                                <FolderOpen size={16} />
                                Project Folder
                            </button>
                        </div>
                        <p className="text-xs text-neutral-400 mt-1 pl-1">
                            {type === "song"
                                ? "💡 Best for: Single song ideas, standalone releases, quick rhymes, or audio demos."
                                : "📂 Best for: Full Albums, EPs, or multi-track spaces to organize and collaborate."}
                        </p>
                    </div>

                    {/* Artwork / Cover Vibe */}
                    <div className="flex flex-col gap-2.5">
                        <label className="text-sm font-bold text-neutral-300">
                            Visual Vibe & Cover Art
                        </label>
                        <p className="text-xs text-neutral-500">
                            Select an inspiring color preset or upload your custom design artwork.
                        </p>
                        
                        <div className="flex items-center gap-3.5 mt-1">
                            {/* Upload cover */}
                            <div className="w-14 h-14 rounded-xl border border-dashed border-neutral-700 hover:border-[#D90097] hover:bg-neutral-900 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group shrink-0">
                                <UploadCloud size={16} className="text-neutral-400 group-hover:text-[#D90097] transition-colors" />
                                <span className="text-[9px] text-neutral-500 mt-1 font-bold group-hover:text-neutral-300">Upload</span>
                            </div>

                            {/* Separator */}
                            <div className="h-8 w-px bg-neutral-800"></div>

                            {/* Presets */}
                            <div className="flex items-center gap-2 overflow-x-auto py-1">
                                {[
                                    { name: "Deep Purple", class: "bg-gradient-to-tr from-indigo-900 via-purple-900 to-purple-950" },
                                    { name: "Neon Rose", class: "bg-gradient-to-tr from-rose-800 via-pink-900 to-rose-950" },
                                    { name: "Cyber Teal", class: "bg-gradient-to-tr from-emerald-800 via-cyan-900 to-blue-950" },
                                    { name: "Sunset Gold", class: "bg-gradient-to-tr from-amber-700 via-orange-900 to-yellow-950" },
                                ].map((preset, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setSelectedPresetCover(idx)}
                                        className={`w-12 h-12 rounded-xl relative overflow-hidden transition-all duration-300 ${preset.class} ${
                                            selectedPresetCover === idx
                                                ? "ring-2 ring-[#D90097] scale-105 shadow-lg shadow-[#D90097]/25"
                                                : "opacity-70 hover:opacity-100 hover:scale-102"
                                        }`}
                                        title={preset.name}
                                    >
                                        {selectedPresetCover === idx && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                <div className="w-2.5 h-2.5 rounded-full bg-[#D90097]"></div>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-neutral-300">
                                {type === "song" ? "Song Title" : "Project Name"}
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={type === "song" ? "e.g. Untitled 01" : "e.g. My New Album"}
                                className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#D90097]/50 transition-colors"
                            />
                        </div>

                        {/* Optional Description (Collapsible) */}
                        <div className="flex flex-col gap-2">
                            {!showDescription ? (
                                <button
                                    type="button"
                                    onClick={() => setShowDescription(true)}
                                    className="text-xs text-[#D90097] hover:underline flex items-center gap-1 font-semibold self-start"
                                >
                                    + Add description (mood, references, key...)
                                </button>
                            ) : (
                                <div className="flex flex-col gap-2 transition-all duration-300 animate-in fade-in slide-in-from-top-1">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-bold text-neutral-300">
                                            Description
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowDescription(false);
                                                setDescription("");
                                            }}
                                            className="text-xs text-neutral-500 hover:text-neutral-300"
                                        >
                                            Hide
                                        </button>
                                    </div>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder={
                                            type === "song"
                                                ? "Write down your song notes, reference tracks, or initial vibe..."
                                                : "Define the theme of this project, notes, release plans..."
                                        }
                                        rows={3}
                                        className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#D90097]/50 transition-colors resize-none"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-neutral-300 flex items-center gap-2">
                                <Users size={16} className="text-neutral-500" />
                                Add Collaborators
                            </label>
                            <input
                                type="text"
                                value={collaborators}
                                onChange={(e) => setCollaborators(e.target.value)}
                                placeholder="Search by name or email"
                                className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#D90097]/50 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-800 bg-[#111]">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-neutral-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!title.trim()}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#AB0063] to-[#D50093] hover:opacity-90 shadow-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Create {type === "song" ? "Song" : "Project"}
                    </button>
                </div>
            </div>
        </div>
    );
};

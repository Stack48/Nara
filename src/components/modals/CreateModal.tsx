"use client";

import { useState } from "react";
import { X, UploadCloud, Users, Music, FolderOpen } from "lucide-react";

interface CreateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateModal = ({ isOpen, onClose }: CreateModalProps) => {
    const [type, setType] = useState<"draft" | "project">("draft");
    const [title, setTitle] = useState("");
    const [collaborators, setCollaborators] = useState("");

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
                        Create New
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-6">
                    {/* Type Toggle */}
                    <div className="flex p-1 bg-black rounded-xl border border-neutral-800">
                        <button
                            onClick={() => setType("draft")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                                type === "draft"
                                    ? "bg-[#202020] text-white shadow-sm"
                                    : "text-neutral-500 hover:text-neutral-300"
                            }`}
                        >
                            <Music size={16} />
                            Draft
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

                    {/* Drag & Drop Area */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-neutral-300">
                            Cover Image
                        </label>
                        <div className="border-2 border-dashed border-neutral-800 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-neutral-600 hover:bg-[#1a1a1a] transition-colors cursor-pointer group">
                            <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center mb-3 group-hover:bg-neutral-800 transition-colors">
                                <UploadCloud size={24} className="text-[#D90097]" />
                            </div>
                            <span className="text-sm font-bold text-white mb-1">
                                Click or drag image here
                            </span>
                            <span className="text-xs text-neutral-500">
                                PNG, JPG or GIF (max. 5MB)
                            </span>
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-neutral-300">
                                {type === "draft" ? "Draft Title" : "Project Name"}
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={type === "draft" ? "e.g. Untitled 01" : "e.g. My New Album"}
                                className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#D90097]/50 transition-colors"
                            />
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
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#AB0063] to-[#D50093] hover:opacity-90 shadow-lg transition-opacity"
                    >
                        Create {type === "draft" ? "Draft" : "Project"}
                    </button>
                </div>
            </div>
        </div>
    );
};

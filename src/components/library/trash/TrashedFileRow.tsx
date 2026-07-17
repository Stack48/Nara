"use client";

import {
    File as FileIcon,
    FileAudio,
    FileImage,
    FileText,
    Clock,
    RotateCcw,
    Trash2,
} from "lucide-react";
import type { TrashedFile } from "@/types/trash";
import {
    formatBytes,
    formatDeletedAt,
    getRetentionLabel,
    getRetentionTone,
} from "@/lib/retention";

interface Props {
    file: TrashedFile;
    isPending?: boolean;
    onRestore: (id: string) => void;
    onRequestDelete: (file: TrashedFile) => void;
}

function iconFor(mime: string) {
    if (mime.startsWith("audio/")) return FileAudio;
    if (mime.startsWith("image/")) return FileImage;
    if (mime.startsWith("text/") || mime.includes("pdf")) return FileText;
    return FileIcon;
}

const TONE_CLASSES = {
    safe: "text-neutral-400 bg-neutral-800/60",
    warning: "text-amber-400 bg-amber-500/10",
    danger: "text-red-400 bg-red-500/10",
} as const;

export function TrashedFileRow({ file, isPending, onRestore, onRequestDelete }: Props) {
    const Icon = iconFor(file.mimeType);
    const tone = getRetentionTone(file);

    return (
        <div
            className={`grid grid-cols-12 gap-4 items-center px-2 py-3 rounded-xl border border-transparent hover:bg-[#151515] hover:border-neutral-800/80 transition-colors group ${
                isPending ? "opacity-50 pointer-events-none" : ""
            }`}
        >
            {/* Name */}
            <div className="col-span-4 flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 shrink-0">
                    <Icon size={16} />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-white truncate">
                        {file.name}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                        {formatBytes(file.size)}
                    </span>
                </div>
            </div>

            {/* Deleted time */}
            <div className="col-span-3 text-xs text-neutral-400 truncate">
                {formatDeletedAt(file)}
            </div>

            {/* Retention countdown */}
            <div className="col-span-3">
                <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${TONE_CLASSES[tone]}`}
                    title="Time left before automatic deletion"
                >
                    <Clock size={12} />
                    {getRetentionLabel(file)}
                </span>
            </div>

            {/* Actions */}
            <div className="col-span-2 flex items-center justify-end gap-1">
                <button
                    type="button"
                    title="Restore"
                    onClick={() => onRestore(file.id)}
                    className="p-1.5 text-neutral-400 hover:text-[#D90097] hover:bg-[#D90097]/10 rounded transition-colors"
                >
                    <RotateCcw size={16} />
                </button>
                <button
                    type="button"
                    title="Delete permanently"
                    onClick={() => onRequestDelete(file)}
                    className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}
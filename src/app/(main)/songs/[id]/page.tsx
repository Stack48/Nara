"use client";

import { Sparkles } from "lucide-react";

export default function LyricsEditorPage() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] p-6 bg-[#0a0a0a] font-arimo text-white">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full border border-[#D90097]/20 mb-6">
                <Sparkles size={36} className="text-[#D90097]" />
            </div>

            <h2 className="font-syne font-bold text-xl md:text-2xl text-white mb-3">
                Waiting for Lyric Editor
            </h2>

            <p className="text-sm text-neutral-400 leading-relaxed mb-6 font-arimo">
                The Lyric Editor is currently being developed on another branch.
                This view will display the lyric workspace once merged.
            </p>

            <div className="flex items-center gap-2 px-3 py-1 bg-neutral-900 border border-neutral-800/80 rounded-full text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                <span>Status: Work In Progress</span>
            </div>
        </div>
    );
}

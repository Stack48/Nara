"use client";

import { useParams, useRouter } from "next/navigation";
import { useSongs } from "@/lib/songStore";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ChevronLeft, Save, Sparkles, Music, Mic, Layers, Settings } from "lucide-react";
import { useAudioClick } from "@/hooks/useAudioClick";

export default function LyricsEditorPage() {
    const params = useParams();
    const router = useRouter();
    const songs = useSongs();
    
    const songId = params?.id as string;
    const song = songs.find((s) => s.id === songId);

    // Initial lyrics depending on song ID, or default placeholder
    const [lyrics, setLyrics] = useState("");

    useEffect(() => {
        if (song) {
            setLyrics(
                `[Intro]\n(Beat starts low, building up...)\nYeah, yeah...\nNara on the record...\n\n[Verse 1]\nI was searching for a sound in the silent night\nTrying to catch a draft under neon light\nDropped it in the folder, moved it to the side\nNow we're building up the project with a sense of pride.\n\n[Chorus]\nAll these songs in my head, let 'em out today\nDrag 'em to the folders, find another way\nFrom the standalone draft to the final beat\nWriting down the story till it feels complete.\n\n[Outro]\n(Beat fades...)\nYeah...\nTill it feels complete.`
            );
        }
    }, [song]);

    const { togglePlay, isPlaying } = useAudioClick(song?.audioSrc || "", 30);

    if (!song) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-neutral-500">
                <Music size={40} className="mb-4 text-neutral-600 animate-pulse" />
                <p>Song not found.</p>
                <button
                    onClick={() => router.push("/songs")}
                    className="mt-4 px-4 py-2 border border-neutral-800 rounded-lg text-xs font-semibold text-white hover:bg-neutral-900 transition-colors"
                >
                    Back to Songs
                </button>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full font-arimo text-white">
            {/* Header toolbar */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-900 mb-6 flex-shrink-0">
                <div className="flex items-center gap-4 min-w-0">
                    <button
                        onClick={() => router.push("/songs")}
                        className="p-2 hover:bg-neutral-950 border border-neutral-800/80 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
                        title="Back to Songs"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <div className="w-10 h-10 rounded-lg overflow-hidden relative flex-shrink-0">
                        <Image
                            src={song.image}
                            alt={song.title}
                            fill
                            className="object-cover"
                            sizes="40px"
                        />
                    </div>
                    <div className="min-w-0">
                        <h1 className="font-syne font-bold text-lg md:text-xl truncate tracking-tight">
                            {song.title}
                        </h1>
                        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                            {song.projectName ? `Project: ${song.projectName}` : "Standalone Song"}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => togglePlay()}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            isPlaying 
                                ? "bg-[#D90097]/10 border-[#D90097] text-[#D90097]" 
                                : "bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-white"
                        }`}
                    >
                        <Music size={14} className={isPlaying ? "animate-pulse" : ""} />
                        <span>{isPlaying ? "Pause Preview" : "Play Preview"}</span>
                    </button>
                    <button
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent("show-nara-toast", {
                                detail: { message: "Lyrics saved successfully!" }
                            }));
                        }}
                        className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-[#AB0063] to-[#D50093] hover:opacity-90 hover:scale-[1.02] shadow-lg rounded-lg text-xs font-bold text-white transition-all cursor-pointer"
                    >
                        <Save size={14} />
                        <span>Save</span>
                    </button>
                </div>
            </div>

            {/* Split Editor and Helper panel */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-hidden pb-4">
                {/* Lyrics Area */}
                <div className="lg:col-span-8 flex flex-col bg-[#111] border border-neutral-900 rounded-2xl p-6 min-h-0">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-900/60 mb-4 flex-shrink-0">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                            <Mic size={12} className="text-neutral-500" />
                            Lyrics Editor
                        </span>
                        <span className="text-[10px] text-neutral-500 font-medium">
                            Auto-saving to cloud
                        </span>
                    </div>
                    <textarea
                        value={lyrics}
                        onChange={(e) => setLyrics(e.target.value)}
                        className="flex-1 w-full bg-transparent text-sm md:text-base text-neutral-200 leading-relaxed focus:outline-none resize-none font-mono py-2"
                        placeholder="Write your lyrics here..."
                    />
                </div>

                {/* AI & Beats Sidebar Helper */}
                <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto">
                    {/* Writing Assistant Panel */}
                    <div className="bg-[#111] border border-neutral-900 rounded-2xl p-5 flex flex-col gap-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-neutral-900/60 text-xs font-bold text-white uppercase tracking-wider">
                            <Sparkles size={14} className="text-[#D90097]" />
                            <span>AI Assistant</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                            Need inspiration? Click below to generate structural rhyming suggestions based on your theme.
                        </p>
                        <button
                            onClick={() => {
                                window.dispatchEvent(new CustomEvent("show-nara-toast", {
                                    detail: { message: "AI Generated 4 new rhyming lines!" }
                                }));
                            }}
                            className="w-full py-2 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-bold text-[#D90097] rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                            <Sparkles size={12} />
                            <span>Suggest Rhymes</span>
                        </button>
                    </div>

                    {/* Beats & Audio Layers */}
                    <div className="bg-[#111] border border-neutral-900 rounded-2xl p-5 flex flex-col gap-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-neutral-900/60 text-xs font-bold text-white uppercase tracking-wider">
                            <Layers size={14} className="text-neutral-500" />
                            <span>Audio Tracks</span>
                        </div>
                        <div className="flex flex-col gap-2.5">
                            <div className="flex items-center justify-between p-2.5 bg-neutral-950 border border-neutral-900 rounded-lg text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                    <Music size={12} className="text-[#D90097]" />
                                    <span className="truncate font-semibold text-neutral-300">Instrumental Beat</span>
                                </div>
                                <span className="text-[10px] text-neutral-500">Active</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 bg-neutral-950 border border-neutral-900 rounded-lg text-xs opacity-50">
                                <div className="flex items-center gap-2 min-w-0">
                                    <Mic size={12} />
                                    <span className="truncate font-semibold text-neutral-300">Vocal Layer 1</span>
                                </div>
                                <span className="text-[10px] text-neutral-500">Muted</span>
                            </div>
                        </div>
                    </div>

                    {/* Settings Panel */}
                    <div className="bg-[#111] border border-neutral-900 rounded-2xl p-5 flex flex-col gap-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-neutral-900/60 text-xs font-bold text-white uppercase tracking-wider">
                            <Settings size={14} className="text-neutral-500" />
                            <span>Song Settings</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-900 flex flex-col gap-1">
                                <span className="text-[9px] text-neutral-500 font-bold uppercase">Tempo</span>
                                <span className="font-bold text-white">92 BPM</span>
                            </div>
                            <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-900 flex flex-col gap-1">
                                <span className="text-[9px] text-neutral-500 font-bold uppercase">Scale Key</span>
                                <span className="font-bold text-white">F Minor</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

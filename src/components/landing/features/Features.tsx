"use client";

import { useState, useEffect } from "react";
import "./Features.css";

// --- COMPOSANT 1 : PROMPTEUR ---
const Prompter = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const lyrics = [
        "I don't wanna die, but I will for the cause",
        "Tell me what I did now, drying off your tears now",
        "Fighting for some years now, something gotta give",
        "I don't wanna rebound, I just wanna sleep sound",
        "These trips come with baggage, been all 'cross this atlas",
        "But keep coming back to this place 'cause they trapped us",
        "I preach what I practice, these streets all I know",
        "And there's no place like home"
    ];

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            interval = setInterval(() => {
                setActiveIndex((prev) => (prev < lyrics.length - 1 ? prev + 1 : prev));
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, lyrics.length]);

    const progress = ((activeIndex) / (lyrics.length - 1)) * 100;

    return (
        <div className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-8">
                <h2 className="font-syne text-4xl md:text-5xl font-bold leading-tight tracking-tighter text-white">
                    Tes lyrics,<br />toujours sous les yeux.
                </h2>
                <div className="max-w-sm">
                    <p className="text-[#888888] font-arimo text-sm mb-4 leading-relaxed">
                        Le mode Prompteur affiche tes lyrics ligne par ligne, au rythme de ta performance.
                        Concentre-toi sur ta voix, pas sur ton téléphone.
                    </p>
                    <span className="text-[#D90097] font-arimo text-sm font-bold uppercase tracking-widest cursor-default">
                        Prompteur →
                    </span>
                </div>
            </div>

            <div 
                className="relative bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden shadow-2xl min-h-[600px]"
                style={{ 
                    WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                    maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)'
                }}
            >
                <div className="flex items-center justify-between px-5 py-4 bg-[#0F0F0F] border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                            <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                        </div>
                        <span className="text-[11px] text-white/80 font-arimo tracking-[0.15em] uppercase">Vince Staples</span>
                    </div>
                    <div className="flex gap-1">
                        <div className="w-1 h-1 rounded-full bg-white/20"></div>
                        <div className="w-1 h-1 rounded-full bg-white/20"></div>
                        <div className="w-1 h-1 rounded-full bg-white/20"></div>
                    </div>
                </div>

                <div className="h-[2px] w-full bg-[#1A1A1A]">
                    <div
                        className="h-full bg-[#D90097]"
                        style={{
                            width: `${progress}%`,
                            transition: isPlaying ? 'width 3000ms linear' : 'width 300ms ease-out'
                        }}
                    ></div>
                </div>

                <div className="flex flex-col md:flex-row p-8 md:p-16 md:pb-32 gap-16 items-start">
                    <div className="flex-1 w-full space-y-10">
                        {lyrics.map((line, index) => {
                            let stateClasses = "";

                            if (index === activeIndex) {
                                stateClasses = "bg-[#1E0D1C] text-white px-6 py-5 rounded-2xl -mx-6";
                            } else if (index < activeIndex) {
                                stateClasses = "text-white/30";
                            } else {
                                stateClasses = "text-white/10";
                            }

                            return (
                                <p
                                    key={index}
                                    className={`font-arimo text-[17px] tracking-wide transition-all duration-500 ease-in-out ${stateClasses}`}
                                >
                                    {line}
                                </p>
                            );
                        })}
                    </div>

                    <div className="w-full md:w-[320px] flex flex-col items-center flex-shrink-0 sticky top-12">
                        <div className="w-full aspect-square rounded-xl overflow-hidden mb-8 bg-[#111]">
                            <img
                                src="/img/vince-staples-cover.jpg"
                                alt="Cover"
                                className="w-full h-full object-cover grayscale opacity-90"
                            />
                        </div>

                        <div className="text-center mb-8">
                            <h4 className="font-syne font-bold text-sm tracking-[0.15em] text-white uppercase">Take Me Home</h4>
                            <p className="text-[#888888] text-[13px] font-arimo mt-2">Vince Staples & Fousheé — Vince Staples</p>
                        </div>

                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => { setActiveIndex(0); setIsPlaying(false); }}
                                className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                </svg>
                            </button>

                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="w-16 h-16 rounded-full bg-[#D90097] flex items-center justify-center hover:scale-105 transition-all active:scale-95"
                            >
                                {isPlaying ? (
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <rect x="7" y="6" width="3" height="12" rx="1" />
                                        <rect x="14" y="6" width="3" height="12" rx="1" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                )}
                            </button>

                            <button className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/20 cursor-not-allowed">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

// --- COMPOSANT 2 : COLLABORATION ---
const ACTIONS = [
    "modifie le Refrain",
    "écrit dans le Couplet 1",
    "a importé un fichier WAV",
    "ajoute une note de mix",
    "modifie la structure",
    "a validé la prise voix"
];

const INITIAL_USERS = [
    { id: 1, name: "Terrence", color: "bg-blue-600", selected: true },
    { id: 2, name: "Malika", color: "bg-emerald-600", selected: false },
    { id: 3, name: "Marion", color: "bg-orange-500", selected: false },
    { id: 4, name: "James", color: "bg-indigo-500", selected: false },
    { id: 5, name: "Momo", color: "bg-purple-600", selected: true },
    { id: 6, name: "Sarah", color: "bg-pink-600", selected: false },
    { id: 7, name: "Antoine", color: "bg-amber-600", selected: false },
    { id: 8, name: "Leila", color: "bg-cyan-600", selected: false },
    { id: 9, name: "Hugo", color: "bg-red-600", selected: false },
];

const TypingIndicator = () => {
    return (
        <div className="flex gap-1.5 items-center bg-white/5 px-2 py-1 rounded-full">
            <div className="typing-dot w-1 h-1 bg-white rounded-full"></div>
            <div className="typing-dot w-1 h-1 bg-white rounded-full"></div>
            <div className="typing-dot w-1 h-1 bg-white rounded-full"></div>
        </div>
    );
};

const Collaboration = () => {
    const [users, setUsers] = useState(INITIAL_USERS);
    const [searchQuery, setSearchQuery] = useState("");

    const [activities, setActivities] = useState([
        { id: 101, userId: 1, action: "modifie le Refrain", time: "il y a 2 min" },
        { id: 102, userId: 5, action: "écrit dans le Couplet 1", time: "il y a 6 min" },
        { id: 103, userId: 5, action: "a importé un fichier WAV", time: "il y a 2 heures" },
    ]);

    const toggleUser = (id: number) => {
        setUsers(users.map(u => u.id === id ? { ...u, selected: !u.selected } : u));
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        const interval = setInterval(() => {
            const activeUsers = users.filter(u => u.selected);
            if (activeUsers.length === 0) return;

            const randomUser = activeUsers[Math.floor(Math.random() * activeUsers.length)];
            const randomAction = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];

            const newActivity = {
                id: Date.now(),
                userId: randomUser.id,
                action: randomAction,
                time: "À l'instant"
            };

            setActivities(prev => {
                const updatedFeed = [newActivity, ...prev].map((act, i) => {
                    if (i === 1 && act.time === "À l'instant") return { ...act, time: "il y a 1 min" };
                    return act;
                });
                return updatedFeed.slice(0, 4);
            });
        }, 10000); // Réduit à 10 secondes

        return () => clearInterval(interval);
    }, [users]);

    return (
        <div className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-8">
                <h2 className="font-syne text-4xl md:text-5xl font-bold leading-tight tracking-tighter text-white">
                    Crée ensemble, en<br />temps réel.
                </h2>
                <div className="max-w-sm">
                    <p className="text-[#888888] font-arimo text-sm mb-4 leading-relaxed">
                        Invite tes collaborateurs et travaille sur le même projet simultanément.
                        Vois qui écrit quoi, assignez des sections, gardez le contrôle de chaque version.
                    </p>
                    <span className="text-[#D90097] font-arimo text-sm font-bold uppercase tracking-widest cursor-default">
                        Collaboration →
                    </span>
                </div>
            </div>

            <div 
                className="relative bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden shadow-2xl min-h-[650px] flex flex-col"
                style={{ 
                    WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                    maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)'
                }}
            >
                <div className="flex items-center justify-between px-5 py-4 bg-[#0F0F0F] border-b border-white/5">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                    </div>
                    <div className="flex gap-1">
                        <div className="w-1 h-1 rounded-full bg-white/20"></div>
                        <div className="w-1 h-1 rounded-full bg-white/20"></div>
                        <div className="w-1 h-1 rounded-full bg-white/20"></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_650px] flex-1 p-8 md:p-16 md:pb-32 gap-16 items-start">
                    <div className="flex-1 w-full relative">
                        <div className="flex items-center justify-between mb-12">
                            <h3 className="text-white/40 text-xs font-syne font-bold uppercase tracking-[0.2em]">
                                Activité en cours
                            </h3>
                        </div>

                        {/* Conteneur d'activité avec hauteur stabilisée pour éviter les sauts */}
                        <div className="space-y-10 min-h-[400px]">
                            {activities.map((activity, index) => {
                                const user = users.find(u => u.id === activity.userId);
                                const isNew = index === 0 && activity.time === "À l'instant";
                                const isTypingAction = activity.action.includes("modifie") || activity.action.includes("écrit");

                                return (
                                    <div
                                        key={activity.id}
                                        className={`flex items-start gap-5 transition-all duration-700 ease-out ${
                                            isNew ? "animate-feature-slide-in text-white" : "text-white/80"
                                        }`}
                                    >
                                        <div className="relative flex-shrink-0 w-14 h-14">
                                            {/* La lettre de l'avatar */}
                                            <div className={`absolute inset-0 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-inner ${user?.color} ${isNew && isTypingAction ? "animate-avatar-show" : ""}`}>
                                                {user?.name.charAt(0)}
                                            </div>
                                            
                                            {/* Les points de typing qui alternent */}
                                            {isNew && isTypingAction && (
                                                <div className="absolute inset-0 rounded-full flex items-center justify-center bg-white/5 animate-avatar-hide">
                                                    <div className="flex gap-1.5 items-center">
                                                        <div className="typing-dot-pink"></div>
                                                        <div className="typing-dot-pink"></div>
                                                        <div className="typing-dot-pink"></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 pt-1 min-h-[60px]">
                                            <p className="font-arimo text-[17px] leading-snug">
                                                <span className="font-bold text-white">{user?.name}</span> {activity.action}
                                            </p>
                                            <p className="text-[#888888] text-[13px] mt-1">{activity.time}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="w-full md:w-[650px] bg-[#0F0F0F]/90 backdrop-blur-2xl border border-white/10 rounded-3xl flex flex-col shadow-[0_32px_64px_-15px_rgba(0,0,0,0.8)] relative -mt-24 z-10 md:-translate-x-12">
                        <div className="p-0 border-b border-white/5">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Ajouter un collaborateur..."
                                className="w-full bg-transparent px-8 py-6 text-white font-arimo text-[17px] caret-[#D90097] outline-none placeholder:text-white/20 transition-all focus:bg-white/[0.02]"
                            />
                        </div>

                        <div className="p-6 space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar">
                            {filteredUsers.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => toggleUser(user.id)}
                                    className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors group text-left"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-md ${user.color}`}>
                                            {user.name.charAt(0)}
                                        </div>
                                        <span className={`font-arimo text-[17px] transition-colors ${user.selected ? "text-white" : "text-white/50 group-hover:text-white/80"}`}>
                                            {user.name}
                                        </span>
                                    </div>

                                    {user.selected && (
                                        <svg className="w-7 h-7 text-[#D90097]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                            {filteredUsers.length === 0 && (
                                <div className="p-8 text-center">
                                    <p className="text-white/20 font-arimo text-sm">Aucun collaborateur trouvé</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

// --- COMPOSANT 3 : ASSISTANT RIMES ---
const RhymeSuggestions = () => {
    const [step, setStep] = useState(0);
    const [typedText, setTypedText] = useState("");

    const fullText = "Le réveil sonne, la ville fait du";

    useEffect(() => {
        let currentText = "";
        let charIndex = 0;
        let timeout: NodeJS.Timeout;
        let isActive = true;

        const runLoop = () => {
            if (!isActive) return;
            setStep(0);
            currentText = "";
            setTypedText("");
            charIndex = 0;
            
            const typeSequence = () => {
                if (!isActive) return;
                if (charIndex < fullText.length) {
                    currentText += fullText[charIndex];
                    setTypedText(currentText);
                    charIndex++;
                    timeout = setTimeout(typeSequence, 30 + Math.random() * 50);
                } else {
                    setStep(1); // Fini de taper
                    timeout = setTimeout(() => {
                        if (!isActive) return;
                        setStep(2); // Affichage des suggestions
                        timeout = setTimeout(() => {
                            if (!isActive) return;
                            setStep(3); // Survol de la suggestion
                            timeout = setTimeout(() => {
                                if (!isActive) return;
                                setStep(4); // Validation
                                setTypedText(currentText + " bruit");
                                timeout = setTimeout(() => {
                                    if (!isActive) return;
                                    setStep(5); // Attente fin
                                    timeout = setTimeout(runLoop, 3500); // Recommence
                                }, 500);
                            }, 1000);
                        }, 1200);
                    }, 600);
                }
            };

            timeout = setTimeout(typeSequence, 1000);
        };

        runLoop();

        return () => {
            isActive = false;
            clearTimeout(timeout);
        };
    }, []);

    return (
        <div className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-8">
                <h2 className="font-syne text-4xl md:text-5xl font-bold leading-tight tracking-tighter text-white">
                    La rime parfaite,<br />au bon moment.
                </h2>
                <div className="max-w-sm">
                    <p className="text-[#888888] font-arimo text-sm mb-4 leading-relaxed">
                        Ne perds plus ton flow. L'assistant intégré de Nara analyse tes couplets en temps réel et te propose des rimes riches sans jamais que tu n'aies à quitter ta page.
                    </p>
                    <span className="text-[#D90097] font-arimo text-sm font-bold uppercase tracking-widest cursor-default">
                        Assistant d'écriture →
                    </span>
                </div>
            </div>

            <div 
                className="relative bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden shadow-2xl min-h-[600px] flex flex-col"
                style={{ 
                    WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                    maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)'
                }}
            >
                {/* Fake App Window */}
                <div className="flex-1 w-full flex flex-col relative z-10 bg-[#0F0F0F]">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#0A0A0A]">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                            <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                        </div>
                        <span className="text-[11px] text-white/50 font-arimo tracking-[0.15em] uppercase">Couplet 1 - Nara Studio</span>
                        <div className="flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-white/20"></div>
                            <div className="w-1 h-1 rounded-full bg-white/20"></div>
                            <div className="w-1 h-1 rounded-full bg-white/20"></div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row flex-1">
                        {/* PARTIE GAUCHE : Editeur (Personne qui écrit) */}
                        <div className="flex-1 p-8 md:p-16 border-r border-white/5 font-arimo text-[20px] md:text-[24px] leading-[2.2] tracking-wide relative">
                            <p className="text-white/40">
                                J'ai des visions de grandeur la <span className={`transition-colors duration-500 font-bold ${step >= 2 ? "text-[#D90097]" : "text-white/40"}`}>nuit</span>,
                            </p>
                            <div className="text-white">
                                {typedText}
                                {/* Curseur dynamique */}
                                <span className={`inline-block w-[2px] h-6 bg-[#D90097] align-middle ml-1 ${step === 1 || step === 5 || step === 0 ? 'animate-pulse' : 'opacity-100'}`}></span>
                            </div>
                            
                            <p className="text-white/40 mt-2 opacity-30 blur-[1px]">Ils parlent tous, mais n'ont rien à dire</p>
                            <p className="text-white/40 opacity-10 blur-[2px]">Je continue d'écrire pour m'en sortir</p>
                            
                            {/* Indicateur de frappe */}
                            <div className={`absolute bottom-8 left-16 flex items-center gap-3 text-white/30 text-sm font-syne transition-opacity duration-300 ${step === 0 ? "opacity-100" : "opacity-0"}`}>
                                <div className="flex gap-1 items-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#D90097] animate-bounce" style={{animationDelay: "0ms"}}></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#D90097] animate-bounce" style={{animationDelay: "150ms"}}></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#D90097] animate-bounce" style={{animationDelay: "300ms"}}></div>
                                </div>
                                Écriture en cours...
                            </div>
                        </div>

                        {/* PARTIE DROITE : Assistant Sidebar */}
                        <div className="w-full md:w-[400px] bg-[#0A0A0A] p-6 md:p-10 flex flex-col relative overflow-hidden">
                            <div className="flex items-center gap-4 mb-10 relative z-10">
                                <div className="w-10 h-10 rounded-xl bg-[#D90097]/20 flex items-center justify-center border border-[#D90097]/30">
                                    <svg className="w-5 h-5 text-[#D90097]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-syne text-white text-lg font-bold tracking-wide">Dictionnaire</h3>
                                    <p className="text-[#888888] text-xs font-arimo mt-0.5">Suggestions de rimes</p>
                                </div>
                            </div>

                            <div className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] relative z-10 ${step >= 2 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none"}`}>
                                <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 mb-8 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D90097] to-purple-600"></div>
                                    <p className="text-white/50 text-[10px] font-arimo uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-[#D90097] animate-pulse"></span>
                                        Analyse de la rime
                                    </p>
                                    <p className="font-syne text-3xl font-bold text-white mb-2 tracking-tight">« nuit »</p>
                                    <p className="text-[#D90097] text-sm font-arimo flex items-center gap-2">
                                        Terminaison : /ɥi/
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {[
                                        { word: 'bruit', match: '99%', type: 'Nom' },
                                        { word: 'minuit', match: '95%', type: 'Nom' },
                                        { word: 'détruit', match: '92%', type: 'Verbe' },
                                        { word: "s'enfuit", match: '88%', type: 'Verbe' },
                                    ].map((item, idx) => (
                                        <div key={idx} className={`p-4 rounded-xl font-arimo transition-all flex items-center justify-between border ${
                                            step >= 3 && idx === 0 
                                                ? "bg-[#D90097]/10 border-[#D90097]/30 text-white transform scale-[1.02] shadow-lg" 
                                                : "bg-[#111111]/50 border-white/5 hover:bg-white/5 text-white/70"
                                        }`}>
                                            <div className="flex items-center gap-4">
                                                <span className={`text-[17px] ${step >= 3 && idx === 0 ? "font-bold text-[#D90097]" : ""}`}>{item.word}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[11px] text-white/30 uppercase tracking-wider">{item.type}</span>
                                                {step >= 3 && idx === 0 ? (
                                                    <span className="text-[10px] bg-[#D90097] text-white px-2 py-1 rounded-md uppercase font-bold tracking-wider shadow-[0_0_10px_rgba(217,0,151,0.5)]">Tab ⇥</span>
                                                ) : (
                                                    <span className="text-[11px] text-[#888] font-mono">{item.match}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Empty state while typing */}
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full transition-all duration-500 delay-100 ${step < 2 ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                                <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-6 bg-[#111111] shadow-inner">
                                    <div className="w-6 h-6 border-2 border-white/10 border-t-[#D90097] rounded-full animate-spin"></div>
                                </div>
                                <p className="text-white/40 text-sm font-arimo tracking-wide">Recherche de rimes...</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Arrière-plan décoratif abstrait */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className={`absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] bg-[#D90097]/10 blur-[100px] rounded-full mix-blend-screen transition-opacity duration-1000 ${
                        step >= 2 && step <= 4 ? "opacity-80 scale-110" : "opacity-30 scale-100"
                    }`}></div>
                </div>
            </div>
        </div>
    );
};


// --- COMPOSANT PRINCIPAL ---
export const Features = () => {
    return (
        <section className="py-20 md:py-32 bg-[#050505]">
            <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8 space-y-32 md:space-y-40">

                {/* Feature 1: Suggestions de rimes automatiques */}
                <RhymeSuggestions />

                {/* Feature 2: Prompteur */}
                <Prompter />

                {/* Feature 3: Collaboration */}
                <Collaboration />

            </div>
        </section>
    );
};
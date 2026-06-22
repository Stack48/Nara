"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import "@/lib/amplify";
import { MenuContext } from "@/context/MenuContext";
import { Song } from "@/lib/songStore";
import { Pencil, MoreHorizontal, MoreVertical, Music, User } from "lucide-react";
import { useApiSongs } from "@/hooks/useApiSongs";
import { useApiProjects } from "@/hooks/useApiProjects";
import { Skeleton } from "@/components/ui/Skeleton";

export const Dashboard = () => {
    const [recentComments, setRecentComments] = useState<any[]>([]);
    const [userName, setUserName] = useState<string>("");
    const [userAvatar, setUserAvatar] = useState<string>("");
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; song: Song } | null>(null);

    const { projects, loading: loadingProjects } = useApiProjects();
    const { songs: allSongs, loading: loadingSongs } = useApiSongs();

    const recentProjects = projects.filter(p => !p.isDeleted).slice(0, 4);
    const recentSongs = [...allSongs]
        .filter(s => !s.isDeleted)
        .sort((a, b) => b.lastModifiedDate.getTime() - a.lastModifiedDate.getTime())
        .slice(0, 4);

    const latestSong = recentSongs[0];
    const latestProject = projects[0];

    useEffect(() => {
        const init = async () => {
            try {
                const user = await getCurrentUser();
                const { fetchUserAttributes } = await import("aws-amplify/auth");
                const attrs = await fetchUserAttributes();
                setUserName(attrs.name || attrs.preferred_username || attrs.email?.split("@")[0] || user.signInDetails?.loginId?.split("@")[0] || "User");
                setUserAvatar(attrs.picture || "");

                const [commentsRes, meRes] = await Promise.all([
                    fetch("/api/comments/recent", { headers: { "x-cognito-id": user.userId } }),
                    fetch("/api/users/me", { headers: { "x-cognito-id": user.userId } })
                ]);
                
                if (commentsRes.ok) setRecentComments(await commentsRes.json());
                if (meRes.ok) {
                    const meData = await meRes.json();
                    if (meData.avatarUrl) setUserAvatar(meData.avatarUrl);
                    if (meData.name) setUserName(meData.name);
                }
            } catch (err) {
                console.error(err);
            }
        };
        init();
    }, []);

    if (loadingProjects || loadingSongs) {
        return (
            <div className="w-full flex-1 flex flex-col font-arimo pb-2">
                <div className="mb-6 flex-shrink-0">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FFFFFF] from-[35%] to-[#D90097] to-[100%] bg-clip-text text-transparent inline-block">
                        Welcome back to NARA
                    </h1>
                    <p className="text-neutral-400 mt-1">Let's write songs together !</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[3fr_2fr] gap-6 flex-1 min-h-0">
                    <div className="lg:col-span-9 relative bg-[#151515] rounded-2xl border border-neutral-800 flex flex-col overflow-hidden">
                        <div className="relative z-10 p-8 flex flex-col lg:flex-row items-center justify-between gap-8 h-full">
                            <div className="flex flex-col justify-center flex-1 w-full gap-4">
                                <Skeleton className="w-40 h-8 rounded-lg" />
                                <div className="mt-4">
                                    <Skeleton className="w-3/4 h-16" />
                                    <Skeleton className="w-48 h-6 mt-2" />
                                </div>
                                <div className="flex items-center gap-3 mt-6">
                                    <Skeleton className="w-32 h-4" />
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                                        <Skeleton className="w-24 h-4" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 mt-8">
                                    <Skeleton className="w-40 h-12 rounded-lg" />
                                    <Skeleton className="w-12 h-12 rounded-lg" />
                                </div>
                            </div>
                            <div className="w-full lg:w-[380px] bg-[#0A0A0A]/80 backdrop-blur-md rounded-xl p-6 border border-neutral-800 flex flex-col gap-4 shadow-2xl">
                                <Skeleton className="w-32 h-4 mb-2" />
                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-3 bg-[#151515] rounded-2xl p-6 border border-neutral-800 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-6">
                            <Skeleton className="w-32 h-4" />
                            <Skeleton className="w-16 h-4" />
                        </div>
                        <div className="flex flex-col gap-4 flex-1 min-h-0">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-24 w-full rounded-xl" />
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-4 bg-[#151515] rounded-2xl p-6 border border-neutral-800 flex flex-col justify-between min-h-0">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <Skeleton className="w-24 h-4" />
                                <Skeleton className="w-12 h-4" />
                            </div>
                            <div className="flex items-center gap-4 mb-6">
                                <Skeleton className="w-16 h-16 rounded-full shrink-0" />
                                <div className="flex flex-col gap-2">
                                    <Skeleton className="w-24 h-6" />
                                    <Skeleton className="w-48 h-3" />
                                    <Skeleton className="w-40 h-3" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 mb-8">
                                <Skeleton className="w-full h-5" />
                                <Skeleton className="w-full h-5" />
                            </div>
                        </div>
                        <Skeleton className="w-[45%] h-12 mx-auto rounded-lg mt-auto" />
                    </div>

                    <div className="lg:col-span-8 bg-[#151515] rounded-2xl p-6 border border-neutral-800 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-6">
                            <Skeleton className="w-32 h-4" />
                            <Skeleton className="w-16 h-4" />
                        </div>
                        <div className="flex flex-col gap-4 flex-1 min-h-0">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-16 w-full rounded-lg" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex-1 flex flex-col font-arimo pb-2">
            {/* Header */}
            <div className="mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FFFFFF] from-[35%] to-[#D90097] to-[100%] bg-clip-text text-transparent inline-block">
                    Welcome back to NARA
                </h1>
                <p className="text-neutral-400 mt-1">Let's write songs together !</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[3fr_2fr] gap-6 flex-1 min-h-0">

                {/* BLOC 1 : SESSION EN ÉCRITURE */}
                <div className="lg:col-span-9 relative bg-[#151515] rounded-2xl border border-neutral-800 flex flex-col overflow-hidden">
                    {latestSong?.image && (
                        <div className="absolute inset-0 z-0">
                            <img src={typeof latestSong.image === "string" ? latestSong.image : latestSong.image?.src} alt="" className="w-full h-full object-cover opacity-50 mix-blend-lighten" />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-[#121212]/60 to-transparent" />
                        </div>
                    )}
                    <div className="relative z-10 p-8 flex flex-col lg:flex-row items-center justify-between gap-8 h-full">
                        <div className="flex flex-col justify-center flex-1 w-full">
                            <span className="inline-flex items-center gap-2 w-fit bg-[#D90097]/10 border border-[#D90097]/30 text-[#D90097] text-xs font-bold tracking-widest px-3 py-1.5 rounded-lg uppercase animate-pulse">
                                <span className="w-2 h-2 rounded-full bg-[#D90097]" />
                                Session en écriture
                            </span>
                            <div className="mt-4">
                                {loadingSongs ? (
                                    <div className="h-16 w-64 bg-neutral-800/60 rounded-lg animate-pulse" />
                                ) : latestSong ? (
                                    <>
                                        <h2 className="text-5xl sm:text-6xl font-extrabold font-syne tracking-widest text-white drop-shadow-lg">
                                            {latestSong.title}
                                        </h2>
                                        <p className="text-xl text-neutral-300 mt-1">
                                            from{" "}
                                            {latestSong.projectName ? (
                                                <Link href={`/projects/${latestSong.projectId}`} className="underline decoration-neutral-500 underline-offset-4 hover:text-white transition-colors">
                                                    {latestSong.projectName}
                                                </Link>
                                            ) : (
                                                <span className="underline decoration-neutral-500 underline-offset-4">Standalone</span>
                                            )}
                                        </p>
                                    </>
                                ) : latestProject ? (
                                    <>
                                        <h2 className="text-5xl sm:text-6xl font-extrabold font-syne tracking-widest text-white drop-shadow-lg">
                                            {latestProject.title}
                                        </h2>
                                        <p className="text-xl text-neutral-300 mt-1">Projet en cours</p>
                                    </>
                                ) : (
                                    <h2 className="text-3xl font-extrabold font-syne text-neutral-500">
                                        Aucune session en cours
                                    </h2>
                                )}
                            </div>
                            <div className="flex items-center gap-3 mt-6">
                                {latestSong && (
                                    <span className="text-neutral-400 text-sm">
                                        Modifié le {latestSong.lastModified}
                                    </span>
                                )}
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#AB0063] to-[#D50093] flex items-center justify-center text-white text-xs font-bold uppercase overflow-hidden shrink-0">
                                        {userAvatar ? (
                                            <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            userName[0]
                                        )}
                                    </div>
                                    <span className="text-neutral-400 text-sm">{userName}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 mt-8">
                                {latestSong ? (
                                    <Link href={`/write/${latestSong.id}`} className="flex items-center gap-2 bg-gradient-to-r from-[#AB0063] to-[#D50093] shadow-lg transition-all hover:scale-[1.02] hover:opacity-90 text-white font-bold py-2.5 px-6 rounded-lg">
                                        <Pencil size={18} />
                                        Continue writing
                                    </Link>
                                ) : (
                                    <button
                                        onClick={async () => {
                                            const user = await getCurrentUser();
                                            const res = await fetch("/api/songs/new", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json", "x-cognito-id": user.userId },
                                                body: JSON.stringify({ title: "Sans titre" }),
                                            });
                                            if (res.ok) {
                                                const data = await res.json();
                                                window.location.href = `/write/${data.id}`;
                                            }
                                        }}
                                        className="flex items-center gap-2 bg-gradient-to-r from-[#AB0063] to-[#D50093] shadow-lg transition-all hover:scale-[1.02] hover:opacity-90 text-white font-bold py-2.5 px-6 rounded-lg"
                                    >
                                        <Pencil size={18} />
                                        Start writing
                                    </button>
                                )}
                                <button className="p-2.5 border border-neutral-600 hover:bg-neutral-800 transition-colors rounded-lg text-white">
                                    <MoreHorizontal size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Structure depuis la vraie song */}
                        <div className="w-full lg:w-[380px] bg-[#0A0A0A]/80 backdrop-blur-md rounded-xl p-6 border border-neutral-800 flex flex-col gap-4 shadow-2xl">
                            <h3 className="font-bold text-xs tracking-widest uppercase text-white">Songs récentes</h3>
                            {loadingSongs ? (
                                <div className="flex flex-col gap-3">
                                    {[1, 2, 3].map(i => <div key={i} className="h-8 bg-neutral-800/60 rounded animate-pulse" />)}
                                </div>
                            ) : recentSongs.length === 0 ? (
                                <p className="text-neutral-600 text-xs">Aucune song pour l'instant</p>
                            ) : (
                                recentSongs.map(song => (
                                    <Link key={song.id} href={`/write/${song.id}`} className="flex items-center justify-between hover:bg-neutral-800/40 px-2 py-1.5 rounded-lg transition-colors">
                                        <div className="flex items-center gap-3">
                                            {song.image ? (
                                                <img src={typeof song.image === "string" ? song.image : song.image.src} alt="" className="w-8 h-8 rounded object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                                                    <Music size={12} className="text-[#D90097] flex-shrink-0" />
                                                </div>
                                            )}
                                            <span className="text-white text-sm font-medium truncate max-w-[150px]">{song.title}</span>
                                        </div>
                                        <span className="text-neutral-500 text-[10px]">{song.lastModified}</span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* BLOC 2 : COMMENTS */}
                <div className="lg:col-span-3 bg-[#151515] rounded-2xl p-6 border border-neutral-800 flex flex-col min-h-0">
                    <div className="flex items-center mb-6">
                        <h3 className="font-syne text-xs font-bold tracking-widest uppercase">Recent Comments</h3>
                    </div>
                    <div className="flex flex-col gap-4 overflow-y-auto flex-1 min-h-0 pr-2 custom-scrollbar">
                        {recentComments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center flex-1 text-neutral-600 text-sm gap-2">
                                <Music size={24} className="text-neutral-700" />
                                <p>Aucun commentaire pour l&apos;instant</p>
                            </div>
                        ) : recentComments.map((comment, index) => (
                            <div key={index} className="bg-black/30 border border-neutral-800/60 rounded-xl p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#AB0063] to-[#D50093] flex items-center justify-center text-xs font-bold text-white uppercase overflow-hidden shrink-0">
                                            {comment.author?.avatarUrl ? (
                                                <img src={comment.author.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                (comment.author?.name || comment.author?.username)?.[0] ?? "?"
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold">{comment.author?.name || comment.author?.username || "Inconnu"}</p>
                                                {comment.author?.username && comment.author.name !== comment.author.username && (
                                                    <span className="text-[10px] text-neutral-500 font-medium bg-neutral-800/50 px-1.5 py-0.5 rounded">@{comment.author.username}</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1.5">
                                                {new Date(comment.createdAt).toLocaleDateString("fr-FR")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full mt-1 ${!comment.isRead ? "bg-[#D90097]" : "bg-neutral-700"}`} />
                                </div>
                                <div className="mt-3 flex items-center gap-1.5">
                                    <Music size={12} className="text-[#D90097] flex-shrink-0" />
                                    <Link href={`/write/${comment.lyrics?.id}`} className="font-semibold text-neutral-200 text-[11px] truncate hover:text-[#D90097] transition-colors">
                                        {comment.lyrics?.title ?? "Inconnu"}
                                    </Link>
                                </div>
                                <p className="text-sm text-neutral-300 leading-relaxed mt-2">{comment.content}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* BLOC 3 : PLAN */}
                <div className="lg:col-span-4 bg-[#151515] rounded-2xl p-6 border border-neutral-800 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-syne text-xs font-bold tracking-widest uppercase">Votre Plan</h3>
                            <Link href="/settings/billing" className="text-xs text-neutral-300 hover:text-white transition-colors">Gérer</Link>
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#AB0063] to-[#D50093] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 uppercase overflow-hidden">
                                {userAvatar ? (
                                    <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    userName[0]
                                )}
                            </div>
                            <div>
                                <h4 className="text-xl font-bold font-syne">Gratuit</h4>
                                <p className="text-xs text-neutral-400 mt-1 leading-snug pr-4">Passez à Pro pour débloquer plus de fonctionnalités.</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 mb-8">
                            <div className="flex justify-between text-sm border-b border-neutral-800 pb-2">
                                <span className="text-neutral-400">Projets</span>
                                <span>{projects.length} créés</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-400">Songs</span>
                                <span>{allSongs.length} créées</span>
                            </div>
                        </div>
                    </div>
                    <button className="w-[45%] mx-auto bg-gradient-to-r from-[#AB0063] to-[#D50093] shadow-lg transition-all hover:scale-[1.02] hover:opacity-90 text-white font-bold py-3 rounded-lg mt-auto">
                        Découvrir NARA Pro
                    </button>
                </div>

                {/* BLOC 4 : RECENTLY OPENED */}
                <div className="lg:col-span-8 bg-[#151515] rounded-2xl p-6 border border-neutral-800 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-syne text-xs font-bold tracking-widest uppercase">Recently Opened</h3>
                        <Link href="/projects" className="text-xs text-neutral-300 hover:text-white transition-colors">Voir tout</Link>
                    </div>
                    <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0 pr-2 custom-scrollbar">
                        {loadingProjects ? (
                            <div className="flex flex-col gap-2">
                                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-neutral-800/60 rounded-lg animate-pulse" />)}
                            </div>
                        ) : recentProjects.length === 0 ? (
                            <div className="flex items-center justify-center flex-1 text-neutral-500 text-sm">
                                Aucun projet pour l'instant
                            </div>
                        ) : recentProjects.map((project, index) => (
                            <div key={project.id} className="flex flex-col">
                                <Link href={`/projects/${project.id}`} className="flex items-center justify-between p-2 hover:bg-neutral-800 transition-colors rounded-lg group cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        {project.image ? (
                                            <img
                                                src={typeof project.image === "string" ? project.image : project.image?.src}
                                                alt={project.title}
                                                className="w-14 h-14 rounded-md object-cover border border-neutral-800"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-md bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
                                                <Music size={20} />
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            <p className="font-bold text-sm">{project.title}</p>
                                            <p className="text-xs text-neutral-500 mt-1">
                                                Modifié le {project.lastModified} • {project.owner || "Moi"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-[11px] px-3 py-1.5 rounded-md ${project.state === "En cours"
                                                ? "bg-[#D90097]/10 text-[#D90097] border border-[#D90097]/30 font-bold"
                                                : "bg-neutral-800 text-neutral-300"
                                            }`}>
                                            {project.state}
                                        </span>
                                        <button className="text-neutral-500 hover:text-white">
                                            <MoreVertical size={18} />
                                        </button>
                                    </div>
                                </Link>
                                {index !== recentProjects.length - 1 && (
                                    <div className="border-b border-neutral-800 mx-2 my-1" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {contextMenu && (
                <MenuContext
                    x={contextMenu.x}
                    y={contextMenu.y}
                    itemType="song"
                    song={contextMenu.song}
                    onClose={() => setContextMenu(null)}
                    onRenameClick={() => setContextMenu(null)}
                />
            )}
        </div>
    );
};
import Image from "next/image";
import Link from "next/link";
import {
    Pencil,
    MoreHorizontal,
    CircleCheck,
    CircleMinus,
    Circle,
    MoreVertical,
} from "lucide-react";
import alfredo from "@/assets/home/alfredo.png";
import allen from "@/assets/home/allen.png";
import duncan from "@/assets/home/duncan.png";
import haslem from "@/assets/home/haslem.png";
import lgseo from "@/assets/home/lgseo.png";
import mcgrady from "@/assets/home/mcgrady.png";
import vince from "@/assets/home/vince.png";

export const Home = () => {
    // Données factices basées sur ton design
    const recentComments = [
        {
            name: "Tracy McGrady",
            time: "il y a 2 heures",
            text: "Le 1er couplet a une super vibe. Peut être faut-il renforcer la chute sur la dernière ligne ?",
            unread: true,
            image: mcgrady,
        },
        {
            name: "Tim Duncan",
            time: "il y a 2 heures",
            text: "Les adlibs en fin de refrain fonctionnent bien, à garder !",
            unread: false,
            image: duncan,
        },
        {
            name: "Ray Allen",
            time: "il y a 2 heures",
            text: "J'aime l'énergie ici. Le bridge manque encore d'impact, on creuse ça ensemble ce soir.",
            unread: false,
            image: allen,
        },
    ];

    const recentProjects = [
        {
            title: "F.I.C.O",
            album: "Let God Sort Em Out",
            time: "il y a 2 heures",
            author: "Udonis Haslem",
            status: "En cours",
            image: lgseo,
        },
        {
            title: "MHM",
            album: "Draft",
            time: "il y a 2 heures",
            author: "Udonis Haslem",
            status: "Statut",
            image: vince,
        },
        {
            title: "Let God Sort Em Out/Chandeliers",
            album: "Let God Sort Em Out",
            time: "il y a 2 heures",
            author: "Udonis Haslem",
            status: "Statut",
            image: lgseo,
        },
        {
            title: "Ensalada",
            album: "Alfredo 2",
            time: "il y a 2 heures",
            author: "Tim Duncan",
            status: "Statut",
            image: alfredo,
        },
    ];

    return (
        <div className="w-full flex-1 flex flex-col font-arimo pb-2">
            {/* en tête */}
            <div className="mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FFFFFF] from-[35%] to-[#D90097] to-[100%] bg-clip-text text-transparent inline-block">
                    Welcome back to NARA
                </h1>
                <p className="text-neutral-400 mt-1">
                    Let's write songs together !
                </p>
            </div>

            {/* grille principale */}
            <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[3fr_2fr] gap-6 flex-1 min-h-0">
                {/* BLOC 1 : SESSION */}
                <div className="lg:col-span-9 relative bg-[#151515] rounded-2xl border border-neutral-800 flex flex-col overflow-hidden">
                    {/* bg img (lgseo) avec overlay */}
                    <div className="absolute inset-0 z-0">
                        <Image
                            src={lgseo}
                            alt="Cover Let God Sort Em Out"
                            fill
                            className="object-cover opacity-50 mix-blend-lighten"
                        />
                        {/* Dégradé pour assombrir la gauche et laisser l'image visible à droite */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-[#121212]/60 to-transparent"></div>
                    </div>

                    {/* contenu principal */}
                    <div className="relative z-10 p-8 flex flex-col lg:flex-row items-center justify-between gap-8 h-full">
                        {/*left : infos session */}
                        <div className="flex flex-col justify-center flex-1 w-full">
                            {/* animation session */}
                            <span className="inline-flex items-center gap-2 w-fit bg-[#D90097]/10 border border-[#D90097]/30 text-[#D90097] text-xs font-bold tracking-widest px-3 py-1.5 rounded-lg uppercase animate-pulse">
                                <span className="w-2 h-2 rounded-full bg-[#D90097]"></span>
                                Session en cours
                            </span>

                            <div className="mt-4">
                                <h2 className="text-5xl sm:text-6xl font-extrabold font-syne tracking-widest text-white drop-shadow-lg">
                                    F.I.C.O
                                </h2>
                                <p className="text-xl text-neutral-300 mt-1">
                                    from{" "}
                                    <span className="underline decoration-neutral-500 underline-offset-4 hover:text-white transition-colors cursor-pointer">
                                        Let God Sort Em Out
                                    </span>
                                </p>
                            </div>

                            <div className="flex items-center gap-3 mt-6">
                                <span className="text-neutral-400 text-sm">
                                    Dernière modification il y a 2 heures
                                </span>
                                <div className="flex items-center gap-2">
                                    <Image
                                        src={haslem}
                                        alt="Udonis Haslem"
                                        width={28}
                                        height={28}
                                        className="rounded-full object-cover w-7 h-7"
                                    />
                                    <span className="text-neutral-400 text-sm">
                                        Udonis Haslem
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mt-8">
                                <Link
                                    href="/lyric-editor"
                                    className="flex items-center gap-2 bg-gradient-to-r from-[#AB0063] from-[0%] to-[#D50093] to-[100%] shadow-lg transition-all hover:scale-[1.02] hover:opacity-90 text-white font-bold py-2.5 px-6 rounded-lg"
                                >
                                    <Pencil size={18} />
                                    Continue writing
                                </Link>

                                <button className="p-2.5 border border-neutral-600 hover:bg-neutral-800 transition-colors rounded-lg text-white">
                                    <MoreHorizontal size={18} />
                                </button>
                            </div>
                        </div>

                        {/* right : structure du morceau */}
                        <div className="w-full lg:w-[380px] bg-[#0A0A0A]/80 backdrop-blur-md rounded-xl p-6 border border-neutral-800 flex flex-col gap-5 shadow-2xl">
                            {/*header */}
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-xs tracking-widest uppercase text-white">
                                    Structure
                                </h3>
                            </div>

                            {/* Couplet 1 */}
                            <div className="flex flex-col gap-2.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CircleCheck
                                            className="text-emerald-300"
                                            size={18}
                                            strokeWidth={2.5}
                                        />
                                        <span className="text-white font-bold text-sm">
                                            Couplet 1
                                        </span>
                                    </div>
                                    <span className="text-emerald-300 text-[10px] font-bold uppercase tracking-wider bg-emerald-300/15 px-2 py-0.5 rounded">
                                        Ecrit
                                    </span>
                                </div>
                            </div>

                            {/* Pre-Chorus */}
                            <div className="flex flex-col gap-2.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CircleMinus
                                            className="text-sky-300"
                                            size={18}
                                            strokeWidth={2.5}
                                        />
                                        <span className="text-white font-bold text-sm">
                                            Pre-Chorus
                                        </span>
                                    </div>
                                    <span className="text-sky-300 text-[10px] font-bold uppercase tracking-wider bg-sky-300/15 px-2 py-0.5 rounded">
                                        Brouillon
                                    </span>
                                </div>
                            </div>

                            {/* Chorus */}
                            <div className="flex flex-col gap-2.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CircleMinus
                                            className="text-orange-300"
                                            size={18}
                                            strokeWidth={2.5}
                                        />
                                        <span className="text-white font-bold text-sm">
                                            Chorus
                                        </span>
                                    </div>
                                    <span className="text-orange-300 text-[10px] font-bold uppercase tracking-wider bg-orange-300/15 px-2 py-0.5 rounded">
                                        A retravailler
                                    </span>
                                </div>
                            </div>

                            {/* Verse 2 */}
                            <div className="flex flex-col gap-2.5 opacity-60">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Circle
                                            className="text-[#8A8A93]"
                                            size={18}
                                        />
                                        <span className="text-[#8A8A93] font-bold text-sm">
                                            Verse 2
                                        </span>
                                    </div>
                                    <span className="text-[#8A8A93] text-[10px] font-bold uppercase tracking-wider bg-[#8A8A93]/15 px-2 py-0.5 rounded">
                                        Vide
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-neutral-800/50 rounded-full"></div>
                            </div>

                            {/* Bridge */}
                            <div className="flex flex-col gap-2.5 opacity-60">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Circle
                                            className="text-[#8A8A93]"
                                            size={18}
                                        />
                                        <span className="text-[#8A8A93] font-bold text-sm">
                                            Bridge
                                        </span>
                                    </div>
                                    <span className="text-[#8A8A93] text-[10px] font-bold uppercase tracking-wider bg-[#8A8A93]/15 px-2 py-0.5 rounded">
                                        Vide
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-neutral-800/50 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BLOC 2 : COMMENTS */}
                <div className="lg:col-span-3 bg-[#151515] rounded-2xl p-6 border border-neutral-800 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-syne text-xs font-bold tracking-widest uppercase">
                            Recent Comments
                        </h3>
                        <Link
                            href="#"
                            className="text-xs text-neutral-300 hover:text-white transition-colors"
                        >
                            Voir tout
                        </Link>
                    </div>

                    <div className="flex flex-col gap-4 overflow-y-auto flex-1 min-h-0 pr-2 custom-scrollbar">
                        {recentComments.map((comment, index) => (
                            <div
                                key={index}
                                className="bg-black/30 border border-neutral-800/60 rounded-xl p-4"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <Image
                                            src={comment.image}
                                            alt={comment.name}
                                            width={32}
                                            height={32}
                                            className="rounded-full object-cover w-8 h-8"
                                        />
                                        <div>
                                            <p className="text-sm font-bold">
                                                {comment.name}
                                            </p>
                                            <p className="text-[11px] text-neutral-500">
                                                {comment.time}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        className={`w-3 h-3 rounded-full mt-1 ${comment.unread ? "bg-[#D90097]" : "bg-neutral-700"}`}
                                    ></div>
                                </div>
                                <p className="text-sm text-neutral-300 leading-relaxed mt-3 pr-8">
                                    {comment.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* BLOC 3 : PLAN */}
                <div className="lg:col-span-4 bg-[#151515] rounded-2xl p-6 border border-neutral-800 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-syne text-xs font-bold tracking-widest uppercase">
                                Votre Plan
                            </h3>
                            <Link
                                href="#"
                                className="text-xs text-neutral-300 hover:text-white transition-colors"
                            >
                                Gérer mon abonnement
                            </Link>
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <Image
                                src={haslem}
                                alt="Gratuit"
                                width={65}
                                height={65}
                                className="rounded-full"
                            />
                            <div>
                                <h4 className="text-xl font-bold font-syne">
                                    Gratuit
                                </h4>
                                <p className="text-xs text-neutral-400 mt-1 leading-snug pr-4">
                                    Passez à un abonnement Pro pour débloquer
                                    plus d'espace et des fonctionnalités
                                    avancées.
                                </p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-neutral-300">
                                    Stockage utilisé
                                </span>
                                <span>2.5 Go / 5 Go</span>
                            </div>
                            <div className="h-2 bg-neutral-800 rounded-full w-full overflow-hidden">
                                <div className="bg-neutral-300 h-full w-[73%] rounded-full"></div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 mb-8">
                            <div className="flex justify-between text-sm border-b border-neutral-800 pb-2">
                                <span className="text-neutral-400">
                                    Projets
                                </span>
                                <span>24 / Illimité</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-400">
                                    Collaborateurs
                                </span>
                                <span>3 / 5</span>
                            </div>
                        </div>
                    </div>

                    <button className="w-[45%] mx-auto bg-gradient-to-r from-[#AB0063] from-[0%] to-[#D50093] to-[100%] shadow-lg transition-all hover:scale-[1.02] hover:opacity-90 text-white font-bold py-3 rounded-lg mt-auto">
                        Découvrir NARA Pro
                    </button>
                </div>

                {/* BLOC 4 : RECENT */}
                <div className="lg:col-span-8 bg-[#151515] rounded-2xl p-6 border border-neutral-800 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-syne text-xs font-bold tracking-widest uppercase">
                            Recently Opened
                        </h3>
                        <Link
                            href="#"
                            className="text-xs text-neutral-300 hover:text-white transition-colors"
                        >
                            Voir tout
                        </Link>
                    </div>

                    <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0 pr-2 custom-scrollbar">
                        {recentProjects.map((project, index) => (
                            <div key={index} className="flex flex-col">
                                <div className="flex items-center justify-between p-2 hover:bg-neutral-800 transition-colors rounded-lg group cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <Image
                                            src={project.image}
                                            alt={project.title}
                                            width={48}
                                            height={48}
                                            className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                                        />

                                        <div className="flex flex-col">
                                            <p className="font-bold text-sm">
                                                {project.title}{" "}
                                                <span className="font-normal text-neutral-400 underline decoration-neutral-600 underline-offset-2">
                                                    ({project.album})
                                                </span>
                                            </p>
                                            <p className="text-xs text-neutral-500 mt-1">
                                                Modifié {project.time} •{" "}
                                                {project.author}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span
                                            className={`text-[11px] px-3 py-1.5 rounded-md ${
                                                project.status === "En cours"
                                                    ? "bg-[#D90097]/10 text-[#D90097] border border-[#D90097]/30 font-bold"
                                                    : "bg-neutral-800 text-neutral-300"
                                            }`}
                                        >
                                            {project.status}
                                        </span>
                                        <button className="text-neutral-500 hover:text-white">
                                            <MoreVertical size={18} />
                                        </button>
                                    </div>
                                </div>
                                {index !== recentProjects.length - 1 && (
                                    <div className="border-b border-neutral-800 mx-2 my-1"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

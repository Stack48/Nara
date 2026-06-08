import { Sun, Bell } from "lucide-react";
import Image from "next/image";
import avisProfil from "@/assets/user/haslem.png";

export const Topbar = () => {
    return (
        <header className="flex items-center justify-between h-14 px-6 border-b border-neutral-800/60 shrink-0 bg-black z-40">
            {/* titre (rendre dynamique plus tard avec usePathname) */}
            <h1 className=" tracking-wide"></h1>

            {/* icônes de droite */}
            <div className="flex items-center gap-3 text-neutral-400">
                <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-neutral-800 bg-black hover:text-white hover:bg-neutral-900 transition-colors">
                    <Sun size={18} />
                </button>

                <div className="w-px h-5 bg-neutral-800 mx-1"></div>

                {/* icône notification pastille rouge */}
                <button className="w-9 h-9 flex items-center justify-center rounded-full border border-neutral-800 bg-black hover:bg-neutral-900 transition-colors">
                    <div className="relative flex items-center justify-center text-red-600">
                        <Bell size={18} />
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-black" />
                    </div>
                </button>

                <button className="w-9 h-9 overflow-hidden rounded-full border border-neutral-800 bg-neutral-800 flex-shrink-0 relative hover:opacity-80 transition-opacity">
                    <Image
                        src={avisProfil}
                        alt="Profil Udonis Haslem"
                        fill
                        className="object-cover"
                        sizes="36px"
                    />
                </button>
            </div>
        </header>
    );
};

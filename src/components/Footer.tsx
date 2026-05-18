import Link from "next/link";

export const Footer = () => (
    <footer className="py-16 bg-transparent font-arimo text-white">
        <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-16">
                <div className="md:col-span-5 flex flex-col gap-5">
                    {/* logo + dégradé */}
                    <span className="font-syne text-2xl font-black tracking-wider uppercase bg-gradient-to-r from-[#FFFFFF] from-[30%] to-[#CD2A9B] to-[100%] bg-clip-text text-transparent w-fit">
                        NARA
                    </span>
                    <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
                        Le premier Hub Créatif conçu pour les artistes musicaux
                        modernes. Simplifiez votre workflow, amplifiez votre
                        son.
                    </p>
                </div>

                {/* navigation */}
                <div className="md:col-span-2 md:col-start-7 flex flex-col gap-4">
                    <h4 className="font-syne text-xs font-bold tracking-widest uppercase text-white">
                        NAVIGATION
                    </h4>
                    <ul className="flex flex-col gap-3 text-sm text-gray-400">
                        <li>
                            <Link
                                href="#"
                                className="hover:text-white transition-colors"
                            >
                                Lien
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="#"
                                className="hover:text-white transition-colors"
                            >
                                Lien
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="#"
                                className="hover:text-white transition-colors"
                            >
                                Lien
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="#"
                                className="hover:text-white transition-colors"
                            >
                                Lien
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* communauté */}
                <div className="md:col-span-2 flex flex-col gap-4">
                    <h4 className="font-syne text-xs font-bold tracking-widest uppercase text-white">
                        COMMUNAUTÉ
                    </h4>
                    <ul className="flex flex-col gap-3 text-sm text-gray-400">
                        <li>
                            <Link
                                href="#"
                                className="hover:text-white transition-colors"
                            >
                                Discord
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="#"
                                className="hover:text-white transition-colors"
                            >
                                Instagram
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="#"
                                className="hover:text-white transition-colors"
                            >
                                X
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="#"
                                className="hover:text-white transition-colors"
                            >
                                Blog
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* légal */}
                <div className="md:col-span-2 flex flex-col gap-4">
                    <h4 className="font-syne text-xs font-bold tracking-widest uppercase text-white">
                        LÉGAL
                    </h4>
                    <ul className="flex flex-col gap-3 text-sm text-gray-400">
                        <li>
                            <Link
                                href="#"
                                className="hover:text-white transition-colors"
                            >
                                Confidentialité
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="#"
                                className="hover:text-white transition-colors"
                            >
                                Conditions d'utilisation
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="#"
                                className="hover:text-white transition-colors"
                            >
                                Mentions légales
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-neutral-800/60 w-full mb-8"></div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
                <p>© 2026 Nara Studio. Tous droits réservés.</p>
                <div className="flex gap-6">
                    <Link
                        href="#"
                        className="hover:text-gray-400 transition-colors"
                    >
                        LinkedIn
                    </Link>
                    <Link
                        href="#"
                        className="hover:text-gray-400 transition-colors"
                    >
                        Youtube
                    </Link>
                </div>
            </div>
        </div>
    </footer>
);

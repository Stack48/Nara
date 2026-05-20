"use client";

import { useState } from "react";

export const Faq = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const questions = [
        {
            question: "Est-ce que Nara fonctionne avec mes outils actuels ?",
            answer: "Absolument. Nara est conçu pour centraliser tes fichiers peu importe ton DAW (Ableton, FL Studio, Logic, etc.)."
        },
        {
            question: "Puis-je collaborer gratuitement ?",
            answer: "Oui, Nara propose un plan gratuit pour permettre aux artistes de tester la collaboration fluide."
        },
        {
            question: "Mes fichiers sont-ils en sécurité ?",
            answer: "La sécurité est notre priorité. Tes créations sont chiffrées et stockées sur des serveurs sécurisés."
        },
        {
            question: "Nara est-il fait pour moi si je débute ?",
            answer: "C'est l'outil idéal pour partir sur de bonnes bases et organiser tes sessions dès le début."
        }
    ];

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="py-20 md:py-32 w-full flex flex-col items-center px-4 sm:px-6 lg:px-8">

            {/* En-tête : Largeur totale pour que le texte centré ait de la place */}
            <div className="w-full text-center mb-16 mx-auto max-w-[1180px]">
                <h2 className="font-syne text-[32px] md:text-[48px] font-extrabold mb-4 tracking-tighter whitespace-nowrap">
                    Les réponses à tes questions.
                </h2>
                <p className="text-gray-400 text-sm md:text-base font-arimo">
                    Tout ce que tu veux savoir avant de te lancer.
                </p>
            </div>

            {/* Liste Accordéon : Largeur contrôlée et centrée avec mx-auto */}
            <div className="w-full max-w-[1000px] mx-auto space-y-4">
                {questions.map((item, index) => (
                    <div
                        key={index}
                        className="bg-[#0A0A0A] rounded-2xl border border-white/5 overflow-hidden transition-all duration-300"
                    >
                        <button
                            onClick={() => toggleFaq(index)}
                            className="w-full flex items-center justify-between p-7 text-left focus:outline-none"
                        >
                            <span className="font-syne text-[14px] md:text-[18px] font-extrabold pr-8">
                                {item.question}
                            </span>
                            <svg
                                className={`w-5 h-5 text-white/50 transition-transform duration-300 ${openIndex === index ? "rotate-90" : ""}`}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="m9 18 6-6-6-6" />
                            </svg>
                        </button>

                        <div
                            className={`transition-all duration-500 ease-in-out ${openIndex === index
                                    ? "max-h-96 opacity-100 p-7 pt-0"
                                    : "max-h-0 opacity-0 pointer-events-none"
                                }`}
                        >
                            <p className="text-gray-400 font-arimo text-sm md:text-base leading-relaxed">
                                {item.answer}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

        </section>
    );
};
"use client";

import { useState } from "react";

export const Faq = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const questions = [
        {
            question: "Est-ce que Nara fonctionne avec mes outils actuels ?",
            answer: "Absolument. Nara est conçu pour centraliser tes fichiers peu importe ton DAW (Ableton, FL Studio, Logic, etc.).",
            color: "bg-[#F9A8D4]" // Pastel Pink
        },
        {
            question: "Puis-je collaborer gratuitement ?",
            answer: "Oui, Nara propose un plan gratuit pour permettre aux artistes de tester la collaboration fluide.",
            color: "bg-[#D8B4FE]" // Pastel Purple
        },
        {
            question: "Mes fichiers sont-ils en sécurité ?",
            answer: "La sécurité est notre priorité. Tes créations sont chiffrées et stockées sur des serveurs sécurisés.",
            color: "bg-[#67E8F9]" // Pastel Cyan
        },
        {
            question: "Nara est-il fait pour moi si je débute ?",
            answer: "C'est l'outil idéal pour partir sur de bonnes bases et organiser tes sessions dès le début.",
            color: "bg-[#FDA4AF]" // Pastel Rose
        }
    ];

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="py-24 md:py-32 w-full flex flex-col items-center px-4 sm:px-6 lg:px-8 relative z-10">

            {/* En-tête */}
            <div className="w-full text-center mb-20 mx-auto max-w-[1180px]">
                <div className="mb-6 flex justify-center">
                    <span className="nara-badge">FAQ</span>
                </div>
                <h2 className="nara-title-2 mb-6 sm:whitespace-nowrap">
                    Les réponses à tes questions.
                </h2>
                <p className="nara-subtitle text-gray-400">
                    Tout ce que tu veux savoir avant de te lancer.
                </p>
            </div>

            {/* Liste Accordéon Editorial */}
            <div className="w-full max-w-[1000px] mx-auto border-t border-white/20">
                {questions.map((item, index) => (
                    <div
                        key={index}
                        className="border-b border-white/20 group hover:bg-white/[0.02] transition-colors duration-300"
                    >
                        <button
                            onClick={() => toggleFaq(index)}
                            className="w-full flex items-center justify-between py-6 px-4 md:px-6 text-left focus:outline-none"
                        >
                            <div className="flex items-center gap-4 md:gap-8 flex-1">
                                <span className="nara-title-4 text-white/50 w-8 md:w-16">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <div className={`w-4 h-4 md:w-5 md:h-5 ${item.color} flex-shrink-0`}></div>
                                <span className="nara-title-4 text-white">
                                    {item.question}
                                </span>
                            </div>
                            
                            <svg
                                className={`w-6 h-6 text-white/50 transition-transform duration-300 flex-shrink-0 ${openIndex === index ? "rotate-90" : ""}`}
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
                            className={`transition-all duration-500 ease-in-out overflow-hidden ${
                                openIndex === index
                                    ? "max-h-96 opacity-100 pb-8"
                                    : "max-h-0 opacity-0"
                            }`}
                        >
                            <div className="pl-[72px] md:pl-[120px] pr-8">
                                <p className="nara-subtitle text-gray-400">
                                    {item.answer}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

        </section>
    );
};
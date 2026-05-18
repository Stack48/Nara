import { Tac_One } from "next/font/google";
import avisProfil from "../../assets/avis-profil.jpg";

const tacOne = Tac_One({
    weight: "400",
    subsets: ["latin"],
    display: "swap",
});

export const Avis = () => {
    const reviews = [
        {
            text: "NARA m'a fait gagner un temps fou. Fini les sessions de recherche avant chaque studio.",
            name: "Terrence Thornton",
            role: "Auteur-Compositeur",
            img: avisProfil.src,
        },
        {
            text: "Je gère mes projets avec mes beatmakers sans friction. Tout le monde voit la même version en temps réel.",
            name: "Malika",
            role: "Productrice indé",
            img: avisProfil.src,
        },
        {
            text: "Avant je perdais des idées tous les jours. Maintenant elles sont toutes là, classées, prêtes.",
            name: "Marion",
            role: "Artiste indé",
            img: avisProfil.src,
        },
    ];

    return (
        <section className="py-24 bg-transparent font-arimo text-white">
            <div className="container mx-auto px-6">
                <h2 className="font-syne text-3xl md:text-5xl font-extrabold leading-tight mb-16 text-center tracking-tighter">
                    Ils créent avec Nara.
                </h2>

                {/* avis */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {reviews.map((review, index) => (
                        <div
                            key={index}
                            className="bg-neutral-900 rounded-2xl p-8 flex flex-col"
                        >
                            {/* guillemets */}
                            <span
                                className={`${tacOne.className} text-[#D90097] text-[280px] leading-[0.6] block -mb-8`}
                                aria-hidden="true"
                            >
                                “
                            </span>

                            {/* txt (flex-1 pousse le profil tout en bas si le texte est court) */}
                            <p className="text-gray-300 text-lg italic leading-relaxed mb-8 flex-1">
                                {review.text}
                            </p>

                            {/* profil */}
                            <div className="flex items-center gap-4">
                                {/* img */}
                                <div className="w-15 h-15 overflow-hidden rounded-full bg-neutral-800 flex-shrink-0">
                                    <img
                                        src={review.img}
                                        alt={`Photo de ${review.name}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* name + role */}
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm tracking-wide">
                                        {review.name}
                                    </span>
                                    <span className="text-gray-400 text-xs mt-0.5">
                                        {review.role}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

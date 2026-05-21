import pv1 from "../../assets/landing/pv1.png"
import pv2 from "../../assets/landing/pv2.png"
import pv3 from "../../assets/landing/pv3.png"

export const Pv = () => {
    const cards = [
        {
            title: "DISPERSION",
            description: "Versions, brouillons, prises vocales tout finit éparpillé. Nara centralise tout au même endroit.",
            img: pv1.src,
        },
        {
            title: "FRICTION",
            description: "Voir qui travaille sur quoi, en temps réel, sans se marcher dessus. Juste toi, tes collabs et la musique.",
            img: pv2.src,
        },
        {
            title: "DÉSORGANISATION",
            description: "Sans structure claire, chaque session repart de zéro. Nara organise tes lyrics et tes exports en un seul endroit.",
            img: pv3.src,
        }
    ];

    return (
        <section className="py-20 md:py-32 bg-transparent font-arimo">
            <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">

                {/* En-tête */}
                <div className="text-center mb-20">
                    <h2 className="nara-title text-3xl md:text-5xl leading-tight mb-6 max-w-7xl mx-auto text-center text-balance tracking-tighter">
                        Ton prochain hit mérite mieux qu'un brouillon perdu.
                    </h2>
                    <p className="text-gray-300 text-xl max-w-2xl mx-auto">
                        Nara réunit tout ce dont tu as besoin pour créer, sans te noyer dans la gestion.
                    </p>
                </div>

                {/* Grille des 3 images */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {cards.map((card, index) => (
                        <div key={index} className="flex flex-col">
                            {/* Image avec coins arrondis */}
                            <div className="aspect-[4/5] overflow-hidden rounded-2xl mb-8 bg-neutral-900">
                                <img
                                    src={card.img}
                                    alt={card.title}
                                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                                />
                            </div>

                            {/* Texte sous l'image */}
                            <h3 className="font-unbounded text-sm font-bold tracking-widest uppercase mb-3">
                                {card.title}
                            </h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {card.description}
                            </p>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
};
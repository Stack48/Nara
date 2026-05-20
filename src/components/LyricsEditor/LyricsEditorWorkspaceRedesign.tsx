"use client";

import {
    GripVertical,
    Plus,
} from "lucide-react";
import {
    useEffect,
    useState,
    type ReactElement,
} from "react";
import type { LyricsFormat } from "@/components/LyricsEditor/LyricsHeader";

type ToggleSliderProps = {
    id: string;
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
};

function ToggleSlider({ id, label, checked, onChange }: ToggleSliderProps): ReactElement {
    return (
        <div className="flex items-center gap-2">
            <span>{label}</span>
            <label htmlFor={id} className="cursor-pointer">
                <input
                    type="checkbox"
                    id={id}
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="sr-only"
                />
                <div className={`w-7 h-4 rounded-full relative transition-colors duration-200 ${checked ? "bg-blue-500" : "bg-red-300"}`}>
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-red-500 shadow-md transition-transform duration-200 ${checked ? "translate-x-full" : "translate-x-0"}`} />
                </div>
            </label>
        </div>
    );
}

export default function LyricsEditorWorkspaceRedesign({
    format,
    onFormatChange,
}: {
    format: LyricsFormat;
    onFormatChange?: (patch: Partial<LyricsFormat>) => void;
}) {
    const [localFormat, setLocalFormat] = useState<LyricsFormat>(format);

    useEffect(() => {
        setLocalFormat(format);
    }, [format]);

    const handleFormatChange = (patch: Partial<LyricsFormat>) => {
        setLocalFormat(prev => ({ ...prev, ...patch }));
        onFormatChange?.(patch);
    };

    return (
        <div className="flex w-full h-full ">
            <section className="textEditor w-full flex flex-col gap-4 h-full">
                <article className="flex w-full justify-between items-center px-4">
                    <h3>My Way</h3>
                    <div className="flex items-center gap-4">
                        <ToggleSlider
                            id="toggle-rhymes"
                            label="Rimes"
                            checked={localFormat.rhymes}
                            onChange={(checked) => handleFormatChange({ rhymes: checked })}
                        />
                        <ToggleSlider
                            id="toggle-annotation"
                            label="Annotation"
                            checked={localFormat.annotation}
                            onChange={(checked) => handleFormatChange({ annotation: checked })}
                        />
                        <ToggleSlider
                            id="toggle-syllables"
                            label="Syllabes"
                            checked={localFormat.syllables}
                            onChange={(checked) => handleFormatChange({ syllables: checked })}
                        />
                        <p>30 mots</p>
                    </div>
                </article>
                <article className="editorContent w-full h-full px-17 py-6 flex flex-col gap-8">
                    <div className="sectionLyrics">
                        <div className="buttons flex flex-row item-center  h-auto gap-2">
                            <button className="cursor-pointer">
                                <Plus size={20} color="#38383C" />
                            </button>
                            <button className="cursor-pointer" >
                                <GripVertical size={20} color="#38383C" />
                            </button>
                            <button >
                                {/* cercle DA069A */}
                                <div className="bg-[#DA069A] w-2 h-2 rounded-full"></div>
                            </button>
                            <h3 aria-label="Nom de la partie" className="text-xl text-white font-medium uppercase h-full">INTRO</h3>
                            <p aria-label="Nombre de mots" className="text-sm text-[#38383C] font-medium h-full">15 mots</p>
                        </div>
                        <div aria-label="zone de texte" className="w-auto  h-auto  border-l-2  border-[#38383C] ml-[59px] px-4 py-2">
                            {/* zone avec ligne qui sont des zone de texte */}
                            <div className="flex flex-row items-center gap-4 ">
                                <button aria-label="Numero de ligne et deplacer ligne">1</button>
                                <input type="text" placeholder="" className="w-full h-auto focus:outline-none" />
                            </div>
                            <div className="flex flex-row items-center gap-4 ">
                                <button aria-label="Numero de ligne et deplacer ligne">2</button>
                                <input type="text" placeholder="" className="w-full h-auto focus:outline-none" />
                            </div>
                            <div className="flex flex-row items-center gap-4 ">
                                <button aria-label="Numero de ligne et deplacer ligne">3</button>
                                <input type="text" placeholder="" className="w-full h-auto focus:outline-none" />
                            </div>
                        </div>
                    </div>
                    <div className="sectionLyrics">
                        <div className="buttons flex flex-row item-center  h-auto gap-2">
                            <button className="cursor-pointer">
                                <Plus size={20} color="#38383C" />
                            </button>
                            <button className="cursor-pointer" >
                                <GripVertical size={20} color="#38383C" />
                            </button>
                            <button >
                                {/* cercle DA069A */}
                                <div className="bg-[#DA069A] w-2 h-2 rounded-full"></div>
                            </button>
                            <h3 aria-label="Nom de la partie" className="text-xl text-white font-medium uppercase h-full">Couplet 1</h3>
                            <p aria-label="Nombre de mots" className="text-sm text-[#38383C] font-medium h-full">15 mots</p>
                        </div>
                        <div aria-label="zone de texte" className="w-auto  h-auto  border-l-2  border-[#38383C] ml-[59px] px-4 py-2">
                            {/* zone avec ligne qui sont des zone de texte */}
                            <div className="flex flex-row items-center gap-4 ">
                                <button aria-label="Numero de ligne et deplacer ligne">1</button>
                                <input type="text" placeholder="" className="w-full h-auto focus:outline-none" />
                            </div>
                            <div className="flex flex-row items-center gap-4 ">
                                <button aria-label="Numero de ligne et deplacer ligne">2</button>
                                <input type="text" placeholder="" className="w-full h-auto focus:outline-none" />
                            </div>
                            <div className="flex flex-row items-center gap-4 ">
                                <button aria-label="Numero de ligne et deplacer ligne">3</button>
                                <input type="text" placeholder="" className="w-full h-auto focus:outline-none" />
                            </div>
                        </div>
                    </div>
                </article>
            </section>
            <section className="outils w-2/6 bg-red-500 "></section>
        </div>
    );
}

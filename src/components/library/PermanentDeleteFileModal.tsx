// src/components/library/PermanentDeleteFileModal.tsx
"use client";

import { useState } from "react";
import { X } from "lucide-react"; // L'icône de fermeture

interface ModalProps {
  isOpen: boolean;
  fileName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function PermanentDeleteFileModal({ isOpen, fileName, onClose, onConfirm }: ModalProps) {
  const [inputTexte, setInputTexte] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
      {/* Fenêtre de la modale avec le fond sombre #121212 typique de Nara */}
      <div className="bg-[#121212] border border-zinc-800 p-6 rounded-xl max-w-md w-full shadow-2xl relative text-white">

        {/* Bouton Fermer en haut à droite */}
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold text-red-500 font-syne">Suppression définitive</h3>

        <p className="mt-4 text-sm text-zinc-400 font-arimo leading-relaxed">
          Attention, cette action est <strong className="text-red-400">irréversible</strong>.
          Le fichier ne pourra pas être récupéré.
        </p>

        <p className="mt-2 text-sm text-zinc-300 font-arimo">
          Pour confirmer, veuillez saisir le nom exact du fichier : <br />
          <span className="inline-block mt-1 p-1 bg-zinc-900 rounded border border-zinc-800 font-mono text-xs text-[#D90097] select-all">
            {fileName}
          </span>
        </p>

        {/* Champ de saisie */}
        <input
          type="text"
          className="mt-4 w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-[#D90097]"
          placeholder="Tapez le nom du fichier ici"
          value={inputTexte}
          onChange={(e) => setInputTexte(e.target.value)}
        />

        {/* Boutons d'action */}
        <div className="mt-6 flex justify-end gap-3 font-arimo text-sm">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white bg-transparent rounded-lg hover:bg-zinc-950 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              onConfirm();
              setInputTexte(""); // On vide le champ pour la prochaine fois
            }}
            disabled={inputTexte !== fileName}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-700 transition-all"
          >
            Supprimer définitivement
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, CheckCircle, HelpCircle, ShieldAlert } from "lucide-react";
import { fetchAuthSession } from "aws-amplify/auth";

export interface WordSuggestion {
  id: string;
  word: string;
  description: string;
  synonyms: string | null;
  antonyms: string | null;
  isVerifiedByNara: boolean;
  status: string;
  createdAt: string;
  category: string | null;
  language: string | null;
  voteSum: number;
  author?: {
    id: string;
    name: string | null;
    username: string | null;
  } | null;
  votes?: Array<{ value: number; userId: string }>;
}

interface WordCardProps {
  wordData: WordSuggestion;
  onVoteSuccess?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  standard: "Standard",
  argot: "Argot / Jargon",
  genre_musical: "Genre Musical",
  geographie: "Origine Géo",
};

export const WordCard = ({ wordData, onVoteSuccess }: WordCardProps) => {
  const [localVoteSum, setLocalVoteSum] = useState(wordData.voteSum);
  const [currentUserVote, setCurrentUserVote] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocalVoteSum(wordData.voteSum);
  }, [wordData.voteSum]);

  // Determine current user and their previous vote
  useEffect(() => {
    const fetchUserAndVote = async () => {
      try {
        let cognitoId = "";
        try {
          const session = await fetchAuthSession();
          cognitoId = session.userSub || session.tokens?.idToken?.payload?.sub || "";
        } catch (err) {
          if (process.env.NODE_ENV === "development") {
            cognitoId = "cognito-marcus-001";
          }
        }

        if (!cognitoId && process.env.NODE_ENV === "development") {
          cognitoId = "cognito-marcus-001";
        }

        if (cognitoId && wordData.votes) {
          const userVote = wordData.votes.find((v) => v.userId === cognitoId);
          if (userVote) {
            setCurrentUserVote(userVote.value);
          } else {
            setCurrentUserVote(0);
          }
        }
      } catch (e) {
        console.error("Error fetching user session for votes:", e);
      }
    };
    fetchUserAndVote();
  }, [wordData]);

  const handleVote = async (value: 1 | -1) => {
    if (loading) return;

    let newVoteValue: number = value;
    let delta: number = value;

    if (currentUserVote === value) {
      newVoteValue = 0;
      delta = -value;
    } else if (currentUserVote !== 0) {
      newVoteValue = value;
      delta = value * 2;
    }

    const previousVoteSum = localVoteSum;
    const previousUserVote = currentUserVote;

    setLocalVoteSum((prev) => prev + delta);
    setCurrentUserVote(newVoteValue);
    setLoading(true);

    try {
      let token = "";
      let cognitoId = "";
      try {
        const session = await fetchAuthSession();
        token = session.tokens?.idToken?.toString() || "";
        cognitoId = session.userSub || session.tokens?.idToken?.payload?.sub || "";
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          cognitoId = "cognito-marcus-001";
        }
      }

      if (!cognitoId && process.env.NODE_ENV === "development") {
        cognitoId = "cognito-marcus-001";
      }

      const res = await fetch(`/api/dictionary/${wordData.id}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cognito-id": cognitoId || "",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ value: newVoteValue === 0 ? value * -1 : newVoteValue }),
      });

      if (!res.ok) {
        throw new Error("Vote request failed");
      }

      const updatedWord = await res.json();
      setLocalVoteSum(updatedWord.voteSum);
      if (onVoteSuccess) onVoteSuccess();
    } catch (error) {
      console.error("Failed to submit vote:", error);
      setLocalVoteSum(previousVoteSum);
      setCurrentUserVote(previousUserVote);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden bg-neutral-900/40 backdrop-blur-md border border-neutral-800/60 hover:border-[#D90097]/40 rounded-2xl p-6 transition-all duration-300 shadow-xl group">
      <div className="absolute -inset-px bg-gradient-to-r from-[#AB0063]/0 to-[#D50093]/0 group-hover:from-[#AB0063]/10 group-hover:to-[#D50093]/10 rounded-2xl transition-all duration-300 -z-10 pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h3 className="text-xl font-bold font-syne text-white tracking-wide">
              {wordData.word}
            </h3>
            {wordData.isVerifiedByNara ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle size={10} />
                Vérifié par Nara
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <HelpCircle size={10} />
                Communautaire
              </span>
            )}
          </div>
          
          {wordData.category && (
            <span className="text-[11px] font-medium text-neutral-400 bg-neutral-800/40 px-2.5 py-1 rounded-md">
              {CATEGORY_LABELS[wordData.category] || wordData.category}
            </span>
          )}
          
          {wordData.language && (
            <span className="text-[11px] font-medium text-neutral-500 bg-neutral-800/20 px-2 py-1 rounded-md ml-1.5 uppercase">
              {wordData.language}
            </span>
          )}
        </div>

        {/* Voting System */}
        <div className="flex items-center gap-1.5 bg-neutral-950/40 border border-neutral-800/40 rounded-lg p-1">
          <button
            onClick={() => handleVote(1)}
            disabled={loading}
            className={`p-1.5 rounded-md hover:bg-neutral-800 transition-colors ${
              currentUserVote === 1 ? "text-emerald-400 bg-emerald-500/10" : "text-neutral-400 hover:text-white"
            }`}
            title="Upvote"
          >
            <ThumbsUp size={14} />
          </button>
          <span className={`text-xs font-bold px-1 min-w-[20px] text-center ${
            localVoteSum > 0 ? "text-emerald-400" : localVoteSum < 0 ? "text-rose-400" : "text-neutral-400"
          }`}>
            {localVoteSum}
          </span>
          <button
            onClick={() => handleVote(-1)}
            disabled={loading}
            className={`p-1.5 rounded-md hover:bg-neutral-800 transition-colors ${
              currentUserVote === -1 ? "text-rose-400 bg-rose-500/10" : "text-neutral-400 hover:text-white"
            }`}
            title="Downvote"
          >
            <ThumbsDown size={14} />
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="text-neutral-300 text-sm leading-relaxed mb-5">
        {wordData.description}
      </p>

      {/* Synonyms & Antonyms */}
      {(wordData.synonyms || wordData.antonyms) && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-800/60 mb-4">
          {wordData.synonyms && (
            <div>
              <span className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Synonymes
              </span>
              <span className="text-xs text-neutral-300">
                {wordData.synonyms}
              </span>
            </div>
          )}
          {wordData.antonyms && (
            <div>
              <span className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Antonymes
              </span>
              <span className="text-xs text-neutral-300">
                {wordData.antonyms}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer for unverified words */}
      {!wordData.isVerifiedByNara && (
        <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 text-[11px] text-amber-400/90 leading-normal">
          <ShieldAlert size={14} className="shrink-0 mt-0.5" />
          <span>
            Ce mot n'est pas vérifié par Nara. Utilisez-le avec précaution dans vos projets d'écriture.
          </span>
        </div>
      )}

      {/* Footer Info */}
      <div className="flex justify-between items-center text-[10px] text-neutral-500 mt-4 pt-2 border-t border-neutral-800/30">
        <span>Suggéré par {wordData.author?.name || wordData.author?.username || "Anonyme"}</span>
        <span>{new Date(wordData.createdAt).toLocaleDateString("fr-FR")}</span>
      </div>
    </div>
  );
};